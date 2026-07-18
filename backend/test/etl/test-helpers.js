const deepClone = (value) => structuredClone(value);

function normalizeKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ');
}

function pick(record, select) {
  if (!select) {
    return deepClone(record);
  }

  const result = {};
  for (const [key, enabled] of Object.entries(select)) {
    if (enabled) {
      result[key] = record[key];
    }
  }
  return result;
}

function createInMemoryPrisma(initialFacilities = []) {
  const state = {
    facilities: initialFacilities.map((facility, index) => ({
      id: facility.id ?? index + 1,
      createdAt: facility.createdAt ?? new Date('2026-07-16T00:00:00Z'),
      updatedAt: facility.updatedAt ?? new Date('2026-07-16T00:00:00Z'),
      ...deepClone(facility),
    })),
    histories: [],
    historyErrors: [],
    nextFacilityId: initialFacilities.length + 1,
    nextHistoryId: 1,
    nextHistoryErrorId: 1,
  };

  const prisma = {
    facility: {
      count: async () => state.facilities.length,
      findMany: async ({ select } = {}) => state.facilities.map((facility) => pick(facility, select)),
      findFirst: async ({ where } = {}) => state.facilities.find((facility) => matchesFacilityWhere(facility, where)) ?? null,
      findUnique: async ({ where } = {}) => {
        if (!where) {
          return null;
        }

        if (typeof where.id === 'number') {
          return state.facilities.find((facility) => facility.id === where.id) ?? null;
        }

        if (typeof where.slug === 'string') {
          return state.facilities.find((facility) => facility.slug === where.slug) ?? null;
        }

        if (typeof where.registrationNumber === 'string') {
          return state.facilities.find((facility) => facility.registrationNumber === where.registrationNumber) ?? null;
        }

        return null;
      },
      update: async ({ where, data }) => {
        const facility = state.facilities.find((item) => item.id === where.id);
        if (!facility) {
          throw new Error(`Facility ${where.id} not found`);
        }

        applyFacilityData(state.facilities, facility, data);
        return deepClone(facility);
      },
      createMany: async ({ data }) => {
        const existingWardcheckIds = new Set(state.facilities.map((facility) => facility.wardcheckId));
        const existingSlugs = new Set(state.facilities.map((facility) => facility.slug));
        const existingRegs = new Set(state.facilities.map((facility) => facility.registrationNumber));

        for (const row of data) {
          if (existingWardcheckIds.has(row.wardcheckId) || existingSlugs.has(row.slug) || existingRegs.has(row.registrationNumber)) {
            const error = new Error('Unique constraint violation');
            error.code = 'P2002';
            throw error;
          }
        }

        for (const row of data) {
          const created = {
            id: state.nextFacilityId++,
            createdAt: new Date('2026-07-16T00:00:00Z'),
            updatedAt: new Date('2026-07-16T00:00:00Z'),
            ...deepClone(row),
          };
          state.facilities.push(created);
          existingWardcheckIds.add(created.wardcheckId);
          existingSlugs.add(created.slug);
          existingRegs.add(created.registrationNumber);
        }

        return { count: data.length };
      },
      create: async ({ data }) => {
        const created = {
          id: state.nextFacilityId++,
          createdAt: new Date('2026-07-16T00:00:00Z'),
          updatedAt: new Date('2026-07-16T00:00:00Z'),
          ...deepClone(data),
        };
        state.facilities.push(created);
        return deepClone(created);
      },
    },
    importHistory: {
      count: async () => state.histories.length,
      findMany: async ({ orderBy, skip = 0, take = state.histories.length } = {}) => {
        const rows = [...state.histories];
        if (orderBy?.startedAt === 'desc') {
          rows.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
        }

        return rows.slice(skip, skip + take).map(deepClone);
      },
      findFirst: async ({ where } = {}) => state.histories.find((history) => matchesHistoryWhere(history, where)) ?? null,
      findUnique: async ({ where } = {}) => state.histories.find((history) => history.id === where.id) ?? null,
      create: async ({ data }) => {
        if (data.status === 'RUNNING' && state.histories.some((history) => history.status === 'RUNNING')) {
          const error = new Error('Unique running import violation');
          error.code = 'P2002';
          throw error;
        }

        const record = {
          id: state.nextHistoryId++,
          startedAt: new Date('2026-07-16T00:00:00Z'),
          completedAt: null,
          duration: null,
          recordsFetched: 0,
          imported: 0,
          updated: 0,
          duplicates: 0,
          skipped: 0,
          failed: 0,
          status: 'RUNNING',
          trigger: 'MANUAL',
          triggeredById: null,
          scheduleName: null,
          retryOfHistoryId: null,
          errorMessage: null,
          ...deepClone(data),
        };
        state.histories.push(record);
        return deepClone(record);
      },
      update: async ({ where, data }) => {
        const history = state.histories.find((item) => item.id === where.id);
        if (!history) {
          throw new Error(`Import history ${where.id} not found`);
        }

        Object.assign(history, deepClone(data));
        return deepClone(history);
      },
    },
    importHistoryError: {
      count: async ({ where } = {}) =>
        state.historyErrors.filter((error) => matchesHistoryErrorWhere(error, where)).length,
      findMany: async ({ where, orderBy, skip = 0, take = state.historyErrors.length } = {}) => {
        const rows = state.historyErrors.filter((error) => matchesHistoryErrorWhere(error, where));
        if (orderBy?.createdAt === 'desc') {
          rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }

        return rows.slice(skip, skip + take).map(deepClone);
      },
      createMany: async ({ data }) => {
        for (const row of data) {
          const created = {
            id: state.nextHistoryErrorId++,
            createdAt: new Date('2026-07-16T00:00:00Z'),
            ...deepClone(row),
          };
          state.historyErrors.push(created);
        }

        return { count: data.length };
      },
      create: async ({ data }) => {
        const created = {
          id: state.nextHistoryErrorId++,
          createdAt: new Date('2026-07-16T00:00:00Z'),
          ...deepClone(data),
        };
        state.historyErrors.push(created);
        return deepClone(created);
      },
    },
    $transaction: async (operations) => Promise.all(operations),
  };

  return {
    prisma,
    getFacilities: () => state.facilities.map(deepClone),
    getHistories: () => state.histories.map(deepClone),
    getImportHistoryErrors: () => state.historyErrors.map(deepClone),
    seedFacilities: (rows) => {
      state.facilities = rows.map((facility, index) => ({
        id: facility.id ?? index + 1,
        createdAt: facility.createdAt ?? new Date('2026-07-16T00:00:00Z'),
        updatedAt: facility.updatedAt ?? new Date('2026-07-16T00:00:00Z'),
        ...deepClone(facility),
      }));
      state.nextFacilityId = state.facilities.length + 1;
    },
  };
}

function matchesFacilityWhere(facility, where) {
  if (!where) {
    return true;
  }

  if (typeof where.slug === 'string' && facility.slug !== where.slug) {
    return false;
  }

  if (typeof where.registrationNumber === 'string' && facility.registrationNumber !== where.registrationNumber) {
    return false;
  }

  if (where.NOT?.id && facility.id === where.NOT.id) {
    return false;
  }

  if (Array.isArray(where.OR)) {
    return where.OR.some((condition) => matchesFacilityWhere(facility, condition));
  }

  if (where.facilityName?.equals && normalizeKey(facility.facilityName) !== normalizeKey(where.facilityName.equals)) {
    return false;
  }

  if (where.county?.equals && normalizeKey(facility.county) !== normalizeKey(where.county.equals)) {
    return false;
  }

  return true;
}

function matchesHistoryWhere(history, where) {
  if (!where) {
    return true;
  }

  if (where.status && history.status !== where.status) {
    return false;
  }

  return true;
}

function matchesHistoryErrorWhere(error, where) {
  if (!where) {
    return true;
  }

  if (typeof where.historyId === 'number' && error.historyId !== where.historyId) {
    return false;
  }

  return true;
}

function applyFacilityData(allFacilities, facility, data) {
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && 'increment' in value) {
      facility[key] = (facility[key] ?? 0) + value.increment;
      continue;
    }

    facility[key] = value;
  }
  facility.updatedAt = new Date('2026-07-16T00:00:00Z');
  return allFacilities;
}

module.exports = {
  createInMemoryPrisma,
};
