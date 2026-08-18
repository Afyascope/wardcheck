/**
 * Content Manager "Import Markdown" document action.
 *
 * Registered only for the WardCheck Article model (`api::article.article`).
 * Renders in the edit view's "More actions" menu (desktop header) and in the
 * right-hand "Entry" panel's "More document actions" menu. Clicking it opens
 * the Markdown importer modal which writes into the native `content` Blocks
 * field of the Article form.
 */

import { Feather } from '@strapi/icons';
import type { DocumentActionComponent } from '@strapi/content-manager/strapi-admin';

import { ImportMarkdownModal } from './ImportMarkdownModal';

export const ARTICLE_MODEL = 'api::article.article';

export const ImportMarkdownDocumentAction: DocumentActionComponent = (props) => {
  if (props.model !== ARTICLE_MODEL) {
    return null;
  }

  return {
    label: 'Import Markdown',
    icon: <Feather />,
    position: ['header', 'panel'],
    disabled: props.activeTab === 'published',
    dialog: {
      type: 'modal',
      title: 'Import Markdown',
      content: ImportMarkdownModal,
    },
  };
};
