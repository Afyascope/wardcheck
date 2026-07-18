import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { KmpdcFacilityRecord, KmpdcFacilitySource } from './facility.types';

const KMPDC_ENDPOINTS: Record<KmpdcFacilitySource, string> = {
  private: 'https://registers.kmpdc.go.ke/healthFacilities/getLicensedPrivateHealthFacilities/',
  faith_based: 'https://registers.kmpdc.go.ke/healthFacilities/getLicensedFaithBasedHealthFacilities/',
  public: 'https://registers.kmpdc.go.ke/healthFacilities/getLicensedPublicHealthFacilities/',
};

@Injectable()
export class KmpdcClient {
  private readonly logger = new Logger(KmpdcClient.name);

  async fetchAllFacilities(): Promise<KmpdcFacilityRecord[]> {
    const [privateFacilities, faithBasedFacilities, publicFacilities] = await Promise.all([
      this.fetchFacilities('private'),
      this.fetchFacilities('faith_based'),
      this.fetchFacilities('public'),
    ]);

    return [...privateFacilities, ...faithBasedFacilities, ...publicFacilities];
  }

  async fetchFacilities(source: KmpdcFacilitySource): Promise<KmpdcFacilityRecord[]> {
    const endpoint = KMPDC_ENDPOINTS[source];
    const response = await fetch(endpoint, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
      },
    });

    if (!response.ok) {
      throw new BadGatewayException(`KMPDC request failed for ${source}: ${response.status}`);
    }

    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as unknown;
      return this.parseJsonPayload(payload, source);
    }

    const html = await response.text();
    return this.parseHtmlPayload(html, source);
  }

  private parseJsonPayload(payload: unknown, source: KmpdcFacilitySource): KmpdcFacilityRecord[] {
    const rows = this.findArrayPayload(payload);
    return rows.map((row, index) => this.normalizeRow(row, source, index + 1));
  }

  private parseHtmlPayload(html: string, source: KmpdcFacilitySource): KmpdcFacilityRecord[] {
    const records: KmpdcFacilityRecord[] = [];
    const tables = Array.from(html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi));

    if (tables.length === 0) {
      this.logger.warn(`No HTML tables were detected on the ${source} KMPDC page.`);
      return this.parseFallbackText(html, source);
    }

    for (const [, tableHtml] of tables) {
      records.push(...this.parseTableHtml(tableHtml ?? '', source));
    }

    if (records.length > 0) {
      return records;
    }

    this.logger.warn(`No HTML table rows were parsed from the ${source} KMPDC page.`);
    return this.parseFallbackText(html, source);
  }

  private parseTableHtml(tableHtml: string, source: KmpdcFacilitySource): KmpdcFacilityRecord[] {
    const rowMatches = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi));
    const rows = rowMatches.map((match, index) => this.parseTableRow(match[1] ?? '', index + 1));
    const headerRowIndex = rows.findIndex((row) => row.isHeader);
    const headerMap = headerRowIndex >= 0 ? this.buildHeaderMap(rows[headerRowIndex]?.cells ?? []) : null;
    const dataRows = headerRowIndex >= 0 ? rows.slice(headerRowIndex + 1) : rows;
    const records: KmpdcFacilityRecord[] = [];

    for (const row of dataRows) {
      const record = headerMap
        ? this.mapHeaderRowToRecord(row.cells, headerMap, source, row.rowNumber)
        : this.mapCellsToRecord(row.cells, source, row.rowNumber);

      if (record) {
        records.push(record);
      }
    }

    return records;
  }

  private parseTableRow(
    rowHtml: string,
    rowNumber: number,
  ): { cells: string[]; isHeader: boolean; rowNumber: number } {
    const cellMatches = Array.from(rowHtml.matchAll(/<(td|th)\b([^>]*)>([\s\S]*?)<\/\1>/gi));
    const cells = cellMatches.map(([, , attributes = '', content = '']) =>
      this.extractCellValue(attributes, content),
    );
    const isHeader = cellMatches.some((match) => match[1]?.toLowerCase() === 'th');

    return { cells, isHeader, rowNumber };
  }

  private buildHeaderMap(headers: string[]): Map<string, number> {
    const headerMap = new Map<string, number>();

    headers.forEach((header, index) => {
      const normalized = this.normalizeHeaderName(header);
      if (normalized) {
        headerMap.set(normalized, index);
      }
    });

    return headerMap;
  }

  private mapHeaderRowToRecord(
    cells: string[],
    headerMap: Map<string, number>,
    source: KmpdcFacilitySource,
    sourceRow: number,
  ): KmpdcFacilityRecord | null {
    const read = (...aliases: string[]): string | null => {
      for (const alias of aliases) {
        const index = headerMap.get(this.normalizeHeaderName(alias));
        if (index === undefined) {
          continue;
        }

        const value = cells[index];
        if (value && value.trim().length > 0) {
          return this.cleanCell(value);
        }
      }

      return null;
    };

    const facilityName = read('facility name', 'facility', 'name', 'health facility', 'hospital');
    if (!facilityName) {
      return null;
    }

    return {
      source,
      sourceRow,
      facilityName,
      registrationNumber: read('registration number', 'registration no', 'reg no', 'license number', 'licence number'),
      postalAddress: read('postal address', 'address', 'location', 'physical address'),
      ownership: read('ownership', 'owner', 'category'),
      facilityType: read('facility type', 'type', 'sub type'),
      facilityLevel: read('facility level', 'level', 'level of care', 'service level'),
      county: read('county'),
      status: read('status', 'license status', 'licence status'),
      raw: cells.reduce<Record<string, string>>((accumulator, value, index) => {
        accumulator[`column_${index + 1}`] = value;
        return accumulator;
      }, {}),
    };
  }

  private parseFallbackText(html: string, source: KmpdcFacilitySource): KmpdcFacilityRecord[] {
    const plainText = this.stripHtml(html);
    const lines = plainText
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => line.length > 0);

    const records: KmpdcFacilityRecord[] = [];
    for (const [index, line] of lines.entries()) {
      if (!/^\d+\s/.test(line)) {
        continue;
      }

      const record = this.mapPlainTextRow(line, source, index + 1);
      if (record) {
        records.push(record);
      }
    }

    return records;
  }

  private mapCellsToRecord(
    cells: string[],
    source: KmpdcFacilitySource,
    sourceRow: number,
  ): KmpdcFacilityRecord | null {
    if (cells.length < 6) {
      return null;
    }

    const normalizedCells = cells.map((cell) => this.cleanCell(cell));
    const offset = normalizedCells.length >= 9 ? 1 : 0;
    const facilityName = normalizedCells[offset + 0] ?? '';
    const registrationNumber = normalizedCells[offset + 1] ?? null;
    const postalAddress = normalizedCells[offset + 2] ?? null;
    const ownership = normalizedCells[offset + 3] ?? null;
    const facilityType = normalizedCells[offset + 4] ?? null;
    const facilityLevel = normalizedCells[offset + 5] ?? null;
    const county = normalizedCells[offset + 6] ?? null;
    const status = normalizedCells[offset + 7] ?? null;

    if (!facilityName) {
      return null;
    }

    return {
      source,
      sourceRow,
      facilityName,
      registrationNumber,
      postalAddress,
      ownership,
      facilityType,
      facilityLevel,
      county,
      status,
      raw: this.toRawObject(normalizedCells),
    };
  }

  private mapPlainTextRow(
    line: string,
    source: KmpdcFacilitySource,
    sourceRow: number,
  ): KmpdcFacilityRecord | null {
    const values = line.split(/\s+/).filter(Boolean);
    if (values.length < 8) {
      return null;
    }

    const indexToken = values.shift();
    if (!indexToken || Number.isNaN(Number.parseInt(indexToken, 10))) {
      return null;
    }

    const status = values.pop() ?? null;
    const county = values.pop() ?? null;
    const facilityLevel = values.pop() ?? null;
    const facilityType = values.pop() ?? null;
    const ownership = values.pop() ?? null;
    const postalAddress = values.length > 0 ? values.slice(1, -1).join(' ') : null;
    const registrationNumber = values[0] ?? null;
    const facilityName = values.slice(1).join(' ') || '';

    if (!facilityName) {
      return null;
    }

    return {
      source,
      sourceRow,
      facilityName,
      registrationNumber,
      postalAddress,
      ownership,
      facilityType,
      facilityLevel,
      county,
      status,
      raw: {
        line,
      },
    };
  }

  private normalizeRow(
    row: Record<string, unknown>,
    source: KmpdcFacilitySource,
    sourceRow: number,
  ): KmpdcFacilityRecord {
    const read = (...keys: string[]): string | null => {
      for (const key of keys) {
        const value = row[key] ?? row[this.normalizeKey(key)];
        if (value === undefined || value === null) {
          continue;
        }

        const normalized = this.cleanCell(String(value));
        if (normalized.length > 0) {
          return normalized;
        }
      }

      return null;
    };

    return {
      source,
      sourceRow,
      facilityName: read('facilityName', 'facility_name', 'name') ?? '',
      registrationNumber: read('registrationNumber', 'registration_number', 'regNo', 'reg_no'),
      postalAddress: read('postalAddress', 'postal_address', 'address'),
      ownership: read('ownership'),
      facilityType: read('facilityType', 'facility_type', 'type'),
      facilityLevel: read('facilityLevel', 'facility_level', 'level'),
      county: read('county'),
      status: read('status'),
      raw: this.toRawObjectFromUnknown(row),
    };
  }

  private findArrayPayload(payload: unknown): Record<string, unknown>[] {
    if (Array.isArray(payload)) {
      return payload.filter((item): item is Record<string, unknown> => this.isRecord(item));
    }

    if (!this.isRecord(payload)) {
      return [];
    }

    const candidateKeys = ['data', 'results', 'items', 'rows', 'records'];
    for (const key of candidateKeys) {
      const value = payload[key];
      if (Array.isArray(value)) {
        return value.filter((item): item is Record<string, unknown> => this.isRecord(item));
      }
    }

    for (const value of Object.values(payload)) {
      if (Array.isArray(value)) {
        return value.filter((item): item is Record<string, unknown> => this.isRecord(item));
      }
    }

    return [];
  }

  private extractCellValue(attributes: string, content: string): string {
    const preferredAttributes = ['data-order', 'data-sort', 'data-search', 'title', 'aria-label'];
    for (const attribute of preferredAttributes) {
      const match = attributes.match(new RegExp(`${attribute}="([^"]*)"`));
      if (match?.[1]) {
        const cleaned = this.cleanCell(this.decodeHtml(match[1]));
        if (cleaned.length > 0) {
          return cleaned;
        }
      }
    }

    return this.cleanCell(this.decodeHtml(this.stripTags(content)));
  }

  private stripHtml(value: string): string {
    return this.decodeHtml(
      value
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, ' '),
    );
  }

  private stripTags(value: string): string {
    return value.replace(/<[^>]+>/g, ' ');
  }

  private decodeHtml(value: string): string {
    return value
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&#x2F;/gi, '/')
      .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number.parseInt(code, 10)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
        String.fromCharCode(Number.parseInt(code, 16)),
      );
  }

  private cleanCell(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private normalizeHeaderName(value: string): string {
    return this.cleanCell(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private toRawObject(values: string[]): Record<string, string> {
    return values.reduce<Record<string, string>>((accumulator, value, index) => {
      accumulator[`column_${index + 1}`] = value;
      return accumulator;
    }, {});
  }

  private toRawObjectFromUnknown(row: Record<string, unknown>): Record<string, string> {
    return Object.entries(row).reduce<Record<string, string>>((accumulator, [key, value]) => {
      accumulator[key] = this.cleanCell(String(value ?? ''));
      return accumulator;
    }, {});
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private normalizeKey(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
  }
}
