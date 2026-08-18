/**
 * Registers the WardCheck Markdown importer into the Content Manager.
 *
 * The importer is exposed as a document action on the Article edit view. It is
 * scoped to the WardCheck Article model inside `ImportMarkdownDocumentAction`,
 * so no other content type is affected.
 */

import type { StrapiApp } from '@strapi/strapi/admin';
import type { DocumentActionComponent } from '@strapi/content-manager/strapi-admin';

import { ImportMarkdownDocumentAction } from './ImportMarkdownAction';

interface ContentManagerApis {
  addDocumentAction: (
    actions:
      | DocumentActionComponent[]
      | ((prev: DocumentActionComponent[]) => DocumentActionComponent[]),
  ) => void;
}

export function registerMarkdownImporter(app: StrapiApp): void {
  const contentManager = app.getPlugin('content-manager');
  if (!contentManager) {
    return;
  }

  const apis = contentManager.apis as unknown as ContentManagerApis;
  if (typeof apis?.addDocumentAction !== 'function') {
    return;
  }

  apis.addDocumentAction([ImportMarkdownDocumentAction]);
}
