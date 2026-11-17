/**
 * Draft handling for the single-row CMS tables (website_homepage, website_settings).
 *
 * The live columns are what the public site shows (when status = 'published').
 * "Save draft" writes the editor's content to the draft_data JSONB column only, so the
 * live site is untouched. "Publish" writes the content to the live columns and clears
 * draft_data.
 */

// Columns that are bookkeeping, not editable content.
const SYSTEM_FIELDS = [
  'id',
  'status',
  'published_at',
  'created_at',
  'updated_at',
  'updated_by',
  'draft_data',
] as const;

/** Editable content of a CMS row, without bookkeeping columns. */
export function contentFields<T extends object>(row: T): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...(row as Record<string, unknown>) };
  for (const key of SYSTEM_FIELDS) delete copy[key];
  return copy;
}

/**
 * Editor state for a row: its live values, overlaid with the saved draft if there is one.
 * Returns the row without draft_data, plus whether a draft exists.
 */
export function withDraft<T extends { draft_data?: Record<string, unknown> | null }>(
  row: T,
): { data: Omit<T, 'draft_data'>; hasDraft: boolean } {
  const { draft_data, ...live } = row;
  const hasDraft = Boolean(draft_data && typeof draft_data === 'object');
  const data = hasDraft ? ({ ...live, ...contentFields(draft_data as object) } as Omit<T, 'draft_data'>) : live;
  return { data, hasDraft };
}
