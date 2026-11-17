# Database migrations

From now on, every database change is a timestamped SQL file in `supabase/migrations/`, managed with the [Supabase CLI](https://supabase.com/docs/guides/cli). The old files in `database/legacy/` are historical only. Do not run them.

## Rules

- One change = one new file: `supabase/migrations/<YYYYMMDDHHMMSS>_<short_name>.sql`. Create it with `supabase migration new <short_name>` or by hand.
- Never edit a migration that has already been applied anywhere. Write a new one.
- Apply to a staging/branch project first, then production.
- Nobody runs SQL against production except the project owner.

## 0. Install and link the CLI (once)

```bash
npm install -g supabase            # or: scoop install supabase / brew install supabase/tap/supabase
supabase --version
supabase login                     # opens a browser; stores an access token locally
supabase link --project-ref <your-project-ref>
# <your-project-ref> is the subdomain of your Supabase URL: https://<ref>.supabase.co
# You will be asked for the database password (Dashboard -> Project Settings -> Database).
```

`supabase link` writes to `supabase/.temp/`. That folder is machine-local and must not be committed.

## 1. Create the baseline (pull the live schema)

The repo currently has a placeholder baseline, `supabase/migrations/20261117000000_baseline_remote_schema.sql`, followed by the P0 fix migrations. `supabase db pull` refuses to run when local migration files are missing from the remote history, so move the fix migrations aside first:

```bash
# from the repo root
mkdir -p supabase/_pending
mv supabase/migrations/2026111700*_t*.sql supabase/_pending/       # every file except the baseline placeholder
rm supabase/migrations/20261117000000_baseline_remote_schema.sql

supabase db pull
# Creates supabase/migrations/<timestamp>_remote_schema.sql and asks:
#   "Update remote migration history table? [Y/n]"  -> answer Y

# Give the pulled file the baseline's version so it sorts before the fixes:
mv supabase/migrations/*_remote_schema.sql supabase/migrations/20261117000000_baseline_remote_schema.sql
supabase migration repair --status reverted <timestamp-that-db-pull-printed>
supabase migration repair --status applied 20261117000000

# Put the fix migrations back:
mv supabase/_pending/*.sql supabase/migrations/ && rmdir supabase/_pending

supabase migration list    # baseline = applied (local + remote); the t01..t07 files = local only
```

Review the pulled baseline before committing it. It must not contain data, only schema. Then commit it on its own:

```bash
git add supabase/migrations/20261117000000_baseline_remote_schema.sql
git commit -m "T08: baseline migration pulled from production"
```

`supabase db pull` uses Docker to diff the schema. If Docker isn't available, use this instead (the schema-only dump needs no Docker):

```bash
supabase db dump --linked --schema public -f supabase/migrations/20261117000000_baseline_remote_schema.sql
supabase migration repair --status applied 20261117000000
```

## 2. Apply pending migrations

Always try a staging project first (create one, link it, `supabase db push`, then click-test).

```bash
supabase link --project-ref <staging-ref>
supabase db push --dry-run     # lists the files it would apply, in order
supabase db push               # applies them and records them in supabase_migrations.schema_migrations
```

Then the same against production once staging is verified.

**Without the CLI:** paste each file into the Supabase SQL editor **in filename order**. Afterwards record them so the CLI knows they ran:

```bash
supabase migration repair --status applied <version>   # once per file, e.g. 20261117000100
```

## 3. Day to day

```bash
supabase migration new add_something    # creates an empty timestamped file
# write SQL, test on staging with: supabase db push
supabase migration list                 # local vs remote status
```

Pending P0 migrations, their order and the checks to run before and after each are listed in `docs/SECURITY-CHECKS.md`.
