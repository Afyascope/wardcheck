/**
 * "Import Markdown" modal rendered from the Article editor.
 *
 * Flow: paste Markdown -> live preview of the converted Strapi 5 Blocks ->
 * Import into Content (replaces/inserts into the native `content` Blocks
 * field). Existing content is never overwritten without an explicit choice.
 */

import { useMemo, useState } from 'react';

import { Alert, Box, Button, Field, Flex, Grid, Textarea, Typography } from '@strapi/design-system';
import { useField, useNotification } from '@strapi/admin/strapi-admin';

import { BlocksPreview } from './BlocksPreview';
import { hasContent, markdownToBlocks } from './blocksFromMarkdown';
import type { BlocksValue } from './types';

export interface ImportMarkdownModalProps {
  onClose: () => void;
}

const MARKDOWN_HELP =
  'Supports # ## ### headings, **bold**, *italic*, ~~strikethrough~~, `inline code`, - lists, 1. ordered lists, [links](https://…), > quotes, ```code blocks```, and --- separators. Raw HTML is never imported.';

const PLACEHOLDER = `# Healthcare Employment Contract in Kenya

Before starting a new healthcare job, understand your employment contract.

## 1. Salary

Check the following:

- Basic salary
- Allowances
- Medical cover

[Search WardCheck](https://wardcheck.co.ke/search)`;

export function ImportMarkdownModal({ onClose }: ImportMarkdownModalProps) {
  const { toggleNotification } = useNotification();
  const contentField = useField<unknown>('content');
  const [markdown, setMarkdown] = useState('');
  const [confirmMode, setConfirmMode] = useState<'replace' | 'append' | null>(null);
  const [justImported, setJustImported] = useState(false);

  const blocks = useMemo(() => markdownToBlocks(markdown), [markdown]);
  const isEmptyInput = markdown.trim() === '';
  const existingContent: BlocksValue = Array.isArray(contentField.value) ? contentField.value : [];
  const hasExisting = hasContent(existingContent);

  const notifyImported = () => {
    toggleNotification({
      type: 'success',
      message: 'Markdown imported into the article content field. Save the article to persist the changes.',
    });
  };

  const doImport = (mode: 'replace' | 'append') => {
    const next = mode === 'append' ? [...existingContent, ...blocks] : blocks;
    contentField.onChange('content', next);
    setConfirmMode(null);
    setJustImported(true);
    notifyImported();
  };

  const handleImportClick = () => {
    if (isEmptyInput) return;
    if (hasExisting) {
      setConfirmMode('replace');
      return;
    }
    doImport('replace');
  };

  return (
    <Box padding={5}>
      <Flex direction="column" alignItems="stretch" gap={4}>
        {justImported ? (
          <Alert
            title="Import complete"
            variant="success"
            onClose={onClose}
            closeLabel="Close"
          >
            {blocks.length} block(s) imported into the article content field. Click{' '}
            <Typography fontWeight="bold">Save</Typography> on the article to persist your changes.
          </Alert>
        ) : (
          <>
            <Typography variant="pi" textColor="neutral600">
              Paste Markdown below and preview the converted blocks before importing them into the
              native Strapi Blocks editor.
            </Typography>

            {hasExisting && (
              <Alert
                title="Existing content will be affected"
                variant="warning"
                closeLabel="Close"
              >
                This article already contains {existingContent.length} block(s). You will be asked
                how to handle them when you import.
              </Alert>
            )}

            <Grid.Root gridCols={12} gap={4}>
              <Grid.Item col={6} xs={12}>
                <Field.Root name="markdown-input">
                  <Field.Label>Markdown</Field.Label>
                  <Textarea
                    name="markdown-input"
                    value={markdown}
                    onChange={(event) => setMarkdown(event.target.value)}
                    placeholder={PLACEHOLDER}
                    resizable
                  />
                  <Typography variant="pi" textColor="neutral600" paddingTop={1}>
                    {MARKDOWN_HELP}
                  </Typography>
                </Field.Root>
              </Grid.Item>

              <Grid.Item col={6} xs={12}>
                <Typography variant="pi" textColor="neutral600">
                  Preview ({blocks.length} block{blocks.length === 1 ? '' : 's'})
                </Typography>
                <Box
                  marginTop={2}
                  padding={4}
                  hasRadius
                  borderColor="neutral200"
                  background="neutral0"
                  shadow="tableShadow"
                  maxHeight="26rem"
                  overflow="auto"
                >
                  {blocks.length > 0 ? (
                    <BlocksPreview blocks={blocks} />
                  ) : (
                    <Typography variant="pi" textColor="neutral600">
                      The preview is empty. Paste Markdown on the left to see the converted blocks.
                    </Typography>
                  )}
                </Box>
              </Grid.Item>
            </Grid.Root>
          </>
        )}

        <Flex justifyContent="space-between" alignItems="center" gap={2} paddingTop={2}>
          {confirmMode ? (
            <Alert
              title="Replace existing article content?"
              variant="warning"
              closeLabel="Close"
              style={{ flex: 1 }}
            >
              Replace the {existingContent.length} existing block(s) with the {blocks.length} imported
              block(s), or insert the imported blocks after the existing content.
            </Alert>
          ) : (
            <Typography variant="pi" textColor="neutral600">
              {isEmptyInput
                ? 'Nothing to import yet.'
                : `${blocks.length} block${blocks.length === 1 ? '' : 's'} ready to import.`}
            </Typography>
          )}

          <Flex gap={2} shrink={0}>
            {confirmMode ? (
              <>
                <Button variant="danger-light" onClick={() => doImport('replace')}>
                  Replace content
                </Button>
                <Button variant="secondary" onClick={() => doImport('append')}>
                  Insert after existing
                </Button>
              </>
            ) : justImported ? (
              <Button variant="default" onClick={onClose}>
                Done
              </Button>
            ) : (
              <>
                <Button variant="tertiary" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="default" onClick={handleImportClick} disabled={isEmptyInput}>
                  Import into Content
                </Button>
              </>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}