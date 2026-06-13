# Supabase RLS Audit

## Findings in this repository

- No Supabase client/server integration was found in the codebase.
- No checked-in SQL migrations or Supabase project metadata were found.
- Because no Supabase database connection exists in this environment, current table-by-table RLS status cannot be read live here.

## Tables with RLS currently disabled

Run this query in your Supabase SQL editor to get the exact list:

```sql
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
```

## Policy SQL (auth.uid() = user_id)

Ready-to-run script:

- `database/supabase/rls_user_id_policies.sql`

It does all of the following for each `public` table that has a `user_id` column:

1. Enables RLS
2. Creates `SELECT` policy: only own rows
3. Creates `INSERT` policy: can only insert own rows
4. Creates `UPDATE` policy: can only update own rows
5. Creates `DELETE` policy: can only delete own rows

## Per-policy SQL pattern

```sql
CREATE POLICY rls_select_own_rows
ON public.<table_name>
FOR SELECT
USING (auth.uid()::text = user_id::text);

CREATE POLICY rls_insert_own_rows
ON public.<table_name>
FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY rls_update_own_rows
ON public.<table_name>
FOR UPDATE
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY rls_delete_own_rows
ON public.<table_name>
FOR DELETE
USING (auth.uid()::text = user_id::text);
```

