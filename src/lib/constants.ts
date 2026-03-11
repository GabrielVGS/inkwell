/** Standard lookback period for mood trend analysis */
export const MOOD_TREND_DAYS = 14;

/** Number of semantically similar entries to retrieve for RAG */
export const RAG_SIMILAR_LIMIT = 5;

/** Minimum score difference to consider a trend as improving/declining */
export const TREND_THRESHOLD = 0.15;

/** Maximum recent entries to scan for writing context */
export const WRITING_CONTEXT_LIMIT = 100;

/** Default page size for paginated entry list */
export const ENTRIES_PAGE_SIZE = 20;

/** Maximum character length for a journal entry */
export const ENTRIES_MAX_LENGTH = 10000;

/** Maximum entries to load for insights page (unpaginated) */
export const INSIGHTS_ENTRIES_CAP = 500;
