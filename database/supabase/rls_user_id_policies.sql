-- Supabase / Postgres RLS baseline for tables with a `user_id` column.
-- Run this in the Supabase SQL editor against your project database.

-- 1) Pre-audit: tables with user_id where RLS is currently disabled
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
  AND a.attname = 'user_id'
  AND c.relrowsecurity = false
ORDER BY n.nspname, c.relname;

-- 2) Enable RLS + create auth.uid() ownership policies for every public table with user_id
DO $$
DECLARE
  rec RECORD;
  fq_table TEXT;
BEGIN
  FOR rec IN
    SELECT
      n.nspname AS schema_name,
      c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid
    WHERE c.relkind = 'r'
      AND n.nspname = 'public'
      AND a.attname = 'user_id'
  LOOP
    fq_table := format('%I.%I', rec.schema_name, rec.table_name);

    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', fq_table);

    EXECUTE format('DROP POLICY IF EXISTS %I ON %s', 'rls_select_own_rows', fq_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %s', 'rls_insert_own_rows', fq_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %s', 'rls_update_own_rows', fq_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %s', 'rls_delete_own_rows', fq_table);

    EXECUTE format(
      'CREATE POLICY %I ON %s FOR SELECT USING (auth.uid()::text = user_id::text)',
      'rls_select_own_rows',
      fq_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON %s FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)',
      'rls_insert_own_rows',
      fq_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON %s FOR UPDATE USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text)',
      'rls_update_own_rows',
      fq_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON %s FOR DELETE USING (auth.uid()::text = user_id::text)',
      'rls_delete_own_rows',
      fq_table
    );
  END LOOP;
END
$$;

-- 3) Post-audit: verify no public user_id table remains with RLS disabled
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
  AND a.attname = 'user_id'
ORDER BY n.nspname, c.relname;

