-- Performance optimization migration
-- Add missing indexes for better query performance

-- 1. Full-text search index for particulars (huge speed boost for search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_entries_particulars_trgm ON entries USING gin(particulars gin_trgm_ops);

-- 2. Composite index for user+account queries (common filtering pattern)
CREATE INDEX IF NOT EXISTS idx_entries_user_account ON entries(user_id, account_id);

-- 3. Composite index for user+date sorting (dashboard views)
CREATE INDEX IF NOT EXISTS idx_entries_user_date_account ON entries(user_id, date DESC, account_id);

-- 4. Index on type for credit/debit filtering
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);

-- 5. Index on updated_at for real-time sync ordering
CREATE INDEX IF NOT EXISTS idx_entries_updated_at ON entries(updated_at DESC);

-- Comment to verify indexes created
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'entries';
