# System Audit — Yahaya Travel & Trade Co. Ltd

Audit date: 2026-11-15 · Branch: `main` @ `611d78b` · Scope: entire repository, live Supabase (read-only, anon key, row counts only), local production build.

**No application source, schema or data was changed during this audit.** No records were created in production.

## Evidence legend

| Tag | Meaning |
|---|---|
| **[CODE]** | Established by reading the source / SQL |
| **[RUN]** | Verified by running the built server locally (HTTP probes) |
| **[DB]** | Verified against live Supabase with the public anon key (row *counts* only, no data read) |
| **[TOOL]** | Verified by tsc / eslint / npm audit / vite build |
| **[NV]** | Needs verification — requires admin login, Supabase dashboard access, or production access I did not have |

Not available to me: an admin login, the Supabase dashboard/SQL editor, Render/Vercel dashboards, Cloudinary account, a browser automation tool. Every authenticated admin journey is therefore **code-traced, not click-tested**.

---

## 1. Executive Summary

**Overall condition:** A visually polished, reasonably well-structured app whose *public website* and *core admin CRUD* mostly work, but which has several broken business workflows, disconnected CMS features, and security/data-integrity gaps. **It is not production-ready for real customer and financial operations in its current state.**

**Major strengths**
- RLS is enabled on every business table and is genuinely enforced: anonymous users see 0 rows of enquiries, clients, quotes, finance, expenses and audit log **[DB]**.
- Finance is owner-only at the database level, not just in the UI **[CODE]**. Income records are voided rather than deleted, and the database refuses DELETE on them **[CODE]**.
- Revenue is computed from actual income records, not from quotes; Net = Revenue − Expenses is correct **[CODE]**.
- Public quote viewing goes through a token-scoped `SECURITY DEFINER` RPC, and the earlier token-table leak has been closed in the live DB **[DB]**.
- Production build succeeds; TypeScript has only 1 error **[TOOL]**.

**Critical weaknesses**
1. **Every Trade-page enquiry fails to submit.** The form has no `name` field, but `submissions.name` is `NOT NULL` **[CODE]**.
2. **Deleting a client silently deletes all of that client's quotes**, plus their responses and links (`ON DELETE CASCADE`) **[CODE]**.
3. **Editing any quote — including a sent or accepted one — overwrites it in place and resets it to `draft`.** The customer's link keeps working and shows the new figures. The revision system exists in the DB, but nothing in the UI uses it, and it would fail anyway (see BUG-07) **[CODE]**.
4. **"Send via WhatsApp" opens a chat with the company's own number, not the client's** **[CODE]**.
5. **Clicking "Save" in Homepage or Company Info CMS unpublishes the live content.** The public site falls back to hard-coded text until someone clicks Publish **[CODE]**.
6. **`/test-env` and `/admin/debug` are public pages.** They print environment configuration, and `/test-env` hard-codes infrastructure identifiers in committed source **[RUN]**.
7. **Refreshing or deep-linking any admin page bounces to login and then to the dashboard** (server returns 307) **[RUN]**.
8. **Not implemented:** team management, Cloudinary/image upload, SEO CMS output, outstanding balances, quote expiry, email notifications.

**Production readiness:** **Not ready.** Public brochure site: close to ready. Admin back-office: usable for enquiries, clients and income/expense logging, but the quote lifecycle and CMS have defects that would mislead staff and customers.

---

## 2. Architecture Assessment

### Actual architecture
```
Browser (React 19 + TanStack Router/Start, Tailwind, Radix/shadcn)
   │  supabase-js (anon key, session in localStorage)
   ▼
Supabase (Postgres + RLS + Auth + RPC functions)          ← all business logic lives here + in React components
   
Node SSR server (TanStack Start → Nitro node-server, Render free plan)
   └─ renders pages; no API layer; only server route is /health
Google Analytics (gtag) · WhatsApp deep links · jsPDF (client-side PDF)
Cloudinary: env vars only — no integration code exists
```

- **There is no backend API.** Every read and write goes straight from React components to Supabase tables or RPCs. Security therefore rests entirely on RLS and `SECURITY DEFINER` functions. That is a valid pattern, but it makes the RLS policies the single line of defence.
- **Routing:** file-based (`src/routes`), 33 routes. Admin pages are guarded three times: route `beforeLoad`, `AdminDashboardShell` in `__root.tsx`, and `AdminGuard`.
- **State:** local `useState` in large page components (quotes.tsx 1,397 lines, expenses.tsx 1,007, finance.tsx 995). React Query is used only for public CMS reads. `src/router.tsx` creates its own `QueryClient`, and the configured one in `src/lib/queryClient.ts` is never used.
- **Migrations:** 25 loose SQL files in `database/`, with no ordering, no migration tool and overlapping definitions. `schema.sql` vs `schema-fixed.sql`, and `finance-schema.sql` vs `SETUP_FINANCE_MODULE.sql`. `finance-schema.sql` cannot run: its trigger functions are declared `RETURNS TEXT`. **The live schema cannot be reproduced reliably from the repo.**

### Architectural weaknesses
| # | Weakness | Evidence |
|---|---|---|
| A1 | No migration system; competing schema files; live DB state unknown | `database/*.sql` |
| A2 | Business rules (quote acceptance, status transitions, number generation) split between UI and DB with no single source of truth | `quotes.tsx`, `quotation-workflow-migration.sql` |
| A3 | Global serial query queue (`queueQuery`) forces every admin query to run one after another, cancelling out the `Promise.all` "parallel" loads | `src/lib/queryQueue.ts`, used in 11 files |
| A4 | Large amount of dead code: `lib/rateLimit.ts`, `lib/security.ts` (all helpers), `lib/api/clients.ts`, `lib/quoteVersioning.ts`, the commented-out Team implementation, `src/lib/queryClient.ts`, the `content_blocks` table | grep — no importers |
| A5 | Very large page components mixing data access, business logic and UI | quotes/finance/expenses/index |
| A6 | Auth check runs 2–3 times per admin navigation; each is a network round-trip | `__root.tsx`, every `beforeLoad`, `AdminGuard` |

---

## 3. Module-by-Module Audit

| Module | Functionality | Status | Problems Identified | Recommended Improvement |
|---|---|---|---|---|
| Public site – Home | CMS hero, stats, FAQs, testimonials, settings | **PARTIALLY WORKING** | Hero image, CTA text/link, mission, vision and success-rate are editable in CMS but never rendered **[CODE]** | Render the fields or remove them from the CMS |
| Public site – Travel | Services, visa quick reference, enquiry form | **WORKING** (code) | `readPublished` swallows errors, so the error UI never shows | Throw on error so React Query can surface it |
| Public site – Trade | Services, enquiry form | **BROKEN** | Every submission fails (`name` null); trade-specific fields discarded (BUG-01) | Map `contact`→`name`, store extra fields |
| Public site – Contact / Quote request | Enquiry forms | **PARTIALLY WORKING** | Quote form drops `company` and `budget`; phones of 7–9 chars pass the browser but fail the DB check | Align validation; persist all fields |
| Public site – About / Privacy / Terms | Static | **WORKING** | Not CMS-managed | Optional |
| Public site – Gallery (`/media`) | CMS gallery | **WORKING** (code) | URL-only images | Add upload |
| Public quote view | Token link, accept/decline/revise | **PARTIALLY WORKING** | Accepts on expired/superseded/draft quotes; "already responded" never detected for anon; uses `alert()` | Validate status/expiry in RPC; return response state from RPC |
| Admin auth | Login, logout, reset, inactivity | **PARTIALLY WORKING** | Deep-link/refresh → login → dashboard **[RUN]**; login audit events never written; client-side lockout only | Skip `beforeLoad` auth on server; honour `?redirect` |
| Dashboard | KPIs + chart | **PARTIALLY WORKING** | "Completed Transactions" = accepted quotes; "Active Clients" = clients *created* in period; "Pending Quotes" ignores `sent`; 1,000-row cap; week range differs between cards and chart | Relabel/recompute; aggregate in SQL |
| Enquiries | List, filter, status, → quote | **PARTIALLY WORKING** | No pagination; status errors silent; no "convert to client"; creating a quote doesn't update enquiry status | Add conversion + status sync |
| Clients | CRUD, search | **PARTIALLY WORKING** | Delete cascades to quotes; no history (enquiries/quotes/payments) on profile | Archive instead of delete; show related records |
| Quotes | CRUD, PDF, CSV, send link | **PARTIALLY WORKING** | In-place edits reset to draft; no versioning; manual status buttons bypass `quote_responses`; no expiry; quote list includes superseded versions | Use revision RPC; lock sent/accepted quotes |
| Quote sending | Token link + WhatsApp | **BROKEN** (WhatsApp) | WhatsApp opens the company's own number; no email sending | Store client phone; build `wa.me/<client>` |
| Finance (income) | Create/edit/void | **WORKING** (code) **[NV]** | Owners can freely edit amounts of active records; no outstanding balance per quote | Edit via void+re-enter, or require reason |
| Expenses | CRUD, categories | **PARTIALLY WORKING** | Edit overwrites `created_by`; hard delete (inconsistent with income void); no receipt upload | Preserve creator; soft-delete |
| Travel / Visa reference | CMS → Travel page | **WORKING** (code) | — | — |
| Trade management | Back-office records | **NOT IMPLEMENTED** | Only the generic enquiries/quotes; no trade-specific data captured | Persist trade fields (product, volume, origin…) |
| Website CMS – Homepage / Company Info | Edit + publish | **BROKEN** (save behaviour) | Save sets live row to draft, which unpublishes the site content | Separate draft columns/table, or keep `published` on save |
| Website CMS – Services / FAQs / Gallery / Testimonials / Visa | CRUD + publish | **WORKING** (code) **[NV]** | Image fields are URL text only | Add upload |
| Website CMS – SEO | Edit meta per page | **NOT IMPLEMENTED** (output) | `website_seo` is never read by public pages | Feed into each route's `head()` |
| Media library | — | **NOT IMPLEMENTED** | "Coming Soon"; no Cloudinary code anywhere | Implement signed uploads |
| Team | — | **NOT IMPLEMENTED** | "Coming Soon"; disabled code queries a non-existent `users` table; RLS blocks listing/modifying `admin_users` | Build via Edge Function with service role |
| Settings | Profile, password, theme, notifications | **PARTIALLY WORKING** | "Current password" never verified; notification preferences fake-saved (`setTimeout` + success toast); "System Status: Operational" hard-coded | Re-auth before password change; persist or remove prefs |
| Notifications | Bell + count | **PARTIALLY WORKING** | In-app polling only; "viewed" state per browser (localStorage) | Store read-state in DB; add email |
| Audit log | Owner view | **PARTIALLY WORKING** | DB-trigger events work; client "LOGIN" events fail (no INSERT policy) | Log logins server-side/trigger |
| Global admin search | Header input | **BROKEN** | Input has no handler | Implement or remove |

---

## 4. Critical Bugs and Technical Issues

### BUG-01 — Trade enquiries cannot be submitted · **CRITICAL**
- **Module:** Public Trade page · **Files:** `src/routes/trade.tsx:161-251`, `src/components/forms/InquiryForm.tsx:69-80`
- **Description:** Trade form fields are `company`, `contact`, … with no `name`. `InquiryForm` sends `name: values['name'] || null`; `submissions.name` is `NOT NULL` (`database/schema-fixed.sql`).
- **Reproduce:** /trade → fill all fields → Submit → "Submission failed".
- **Root cause:** field-name mismatch; no per-form mapping.
- **Impact:** The Trade division receives **zero** web leads; customers see an error. All trade-specific fields (product, volume, goods, origin, delivery, quantity…) are discarded even if fixed.
- **Fix:** Rename `contact`→`name` (or map it); add a `details JSONB` column (or `company` + `extra` columns) and store the remaining fields.
- **Evidence:** [CODE]. Not submitted against production by design.

### BUG-02 — Deleting a client deletes their quotes · **CRITICAL**
- **Files:** `database/quotes-schema.sql` (`client_id … ON DELETE CASCADE`), `src/routes/admin/clients.tsx:255`
- **Reproduce:** Create client → create quote for client → delete client → quote, responses and access tokens are gone. Income linked to that quote loses its `quote_id`.
- **Impact:** Irreversible loss of commercial history; editors can do this too.
- **Fix:** Change FK to `ON DELETE RESTRICT` (or `SET NULL`); replace delete with archive (`status='inactive'`).

### BUG-03 — Quote edits overwrite history and reset status · **HIGH**
- **File:** `src/routes/admin/quotes.tsx:409-441` (`status: 'draft'` on every save; `.update()` in place)
- **Reproduce:** Accept a quote (online or via button) → Edit → Save → status is `draft`; the customer's existing link now shows the new figures.
- **Impact:** Accepted terms can be silently altered; counts on the dashboard change; audit is only in `audit_log` JSON.
- **Fix:** Block editing when status ∈ {sent, accepted, rejected}; offer "Create revision" using `create_quote_revision` (after BUG-07). Revoke old tokens on revision.

### BUG-04 — WhatsApp share sends to the company itself · **HIGH**
- **File:** `src/lib/quoteTokens.ts:136-159` (hard-coded `2349127650968`)
- **Impact:** Staff think the quote was sent; the client never receives it.
- **Fix:** Add `client_phone` to quotes (from client/enquiry), normalise to E.164, build `wa.me/<client>`; keep "copy link" as fallback.

### BUG-05 — CMS "Save" unpublishes live Homepage / Company Info · **HIGH**
- **Files:** `src/routes/admin/website/homepage.tsx:107`, `company-info.tsx:79`; RLS `status = 'published'` for public reads.
- **Reproduce:** CMS → Homepage → change subtitle → Save → public home shows hard-coded defaults; footer, contact page and WhatsApp button fall back to `site.ts` values after a Company Info save.
- **Fix:** Store drafts separately (`draft_data JSONB` column or a draft row) and publish by copying; never flip the live row's status on save.

### BUG-06 — Admin deep links / refresh land on dashboard · **HIGH**
- **Files:** every `src/routes/admin/*.tsx` `beforeLoad`; `src/routes/admin/login.tsx:22-30, 66`
- **Evidence [RUN]:** `GET /admin/clients` → `307 /admin/login?redirect=%2Fadmin%2Fclients`. On the server there is no localStorage session, so the check always fails; the login page then navigates to `/admin` and ignores `redirect`.
- **Impact:** Every browser refresh, bookmark, or shared admin link loses the user's place (and causes a flash of the login page).
- **Fix:** In `beforeLoad`, return early when `typeof window === 'undefined'` (or set `ssr: false` on admin routes); make login honour a validated same-origin `redirect`.

### BUG-07 — Quote revision RPC always fails · **HIGH** (latent)
- **File:** `database/quotation-workflow-migration.sql` / `secure-quote-revision-migration.sql` → new number `QT-2026-001v2` violates `valid_quote_number CHECK (^QT-[0-9]{4}-[0-9]{3,}$)` in `quotes-schema.sql`.
- **Impact:** The versioning feature cannot work; it is currently unused by the UI (`src/lib/quoteVersioning.ts` has no importers).
- **Fix:** Relax the check to allow `(v[0-9]+)?$`, or keep `quote_number` and rely on `version_number`.

### BUG-08 — Public quote response accepts invalid states · **HIGH**
- **File:** `database/fix-public-quote-response-permissions.sql` (`submit_public_quote_response`)
- **Description:** Does not check `valid_until`, `is_current_version`, or status (draft/expired/rejected). Duplicate check blocks *any* second response, including after an admin-recorded one. Returns raw `SQLERRM` to anonymous callers.
- **Fix:** Reject when not current, past `valid_until`, or status ∉ {sent, pending}; generic error messages.

### BUG-09 — Anonymous direct insert into `quote_responses` · **MEDIUM** (security)
- **File:** policy "Public insert access to quote_responses" `WITH CHECK (response_method='online')` + `GRANT INSERT … TO anon`
- **Description:** Anyone with the anon key can insert a response row for any quote UUID, with no token. The RPC already handles the legitimate path.
- **Fix:** Drop the policy and the grant; keep the RPC only.

### BUG-10 — "Already responded" never detected on public quote page · **MEDIUM**
- **File:** `src/routes/quote/view.$token.tsx` → `hasQuoteBeenResponded` selects `quote_responses` as anon; no SELECT policy, so it always returns empty.
- **Impact:** After responding and reloading, the customer sees the buttons again; a second click gets an `alert()` error.
- **Fix:** Return `latest_response` from `get_public_quote_by_token`.

### BUG-11 — Dashboard metrics mislabelled / truncated · **MEDIUM**
- **File:** `src/routes/admin/index.tsx:170-330`
- "Completed Transactions" counts accepted **quotes**. "Active Clients" counts active clients **created** within the period. "Pending Quotes" excludes `sent`. Revenue/expense totals sum fetched rows, and PostgREST caps responses (default 1,000 rows), so totals silently undercount at scale. The "Week" card uses the last 7 days but the chart uses Monday-to-date.
- **Fix:** SQL aggregate RPC (`sum`, `count`) per period; rename metrics; count `financial_transactions` for completed transactions.

### BUG-12 — Public debug pages · **HIGH** (security hygiene)
- **Files:** `src/routes/test-env.tsx`, `src/routes/admin/debug.tsx` (no guard) — both return 200 **[RUN]**.
- `/test-env` prints all `VITE_*` values and hard-codes the expected Supabase project ref, Cloudinary cloud name and a Cloudinary numeric identifier in committed source. `/admin/debug` probes tables.
- **Fix:** Delete both routes. Rotate the Cloudinary credential if that numeric value is an API key. Treat `VITE_IP_SALT` as public (every `VITE_` variable ships in the browser bundle — confirmed in 3 bundle files **[RUN]**).

### BUG-13 — Settings password change ignores current password · **MEDIUM**
- **File:** `src/routes/admin/settings.tsx:84-117`. Anyone at an unlocked session can change the password. Notification preferences are fake-saved (`:119-130`).
- **Fix:** Re-authenticate with `signInWithPassword` before `updateUser`; persist or remove preferences.

### BUG-14 — Enquiry phone validation mismatch · **MEDIUM**
- **Files:** `InquiryForm.tsx:31` (min 7) vs DB `CHECK (LENGTH(phone) >= 10)`. Users get a generic failure for 7–9 character numbers.

### BUG-15 — Expense edit overwrites creator · **LOW**
- **File:** `src/routes/admin/expenses.tsx:690-700` (`created_by: user.id` in update payload).

### BUG-16 — Login audit events never written · **LOW**
- **File:** `src/lib/auth.ts:183-216`; `audit_log` has no INSERT policy, so the insert fails silently. `LOGIN_FAILED` only fires on thrown exceptions and requires a session, so it never logs.

### BUG-17 — Header search non-functional · **LOW**
- **File:** `src/components/admin/AdminLayout.tsx:376-383`.

### BUG-18 — CMS singletons not enforced · **LOW**
- `CHECK (id IS NOT NULL)` does not enforce one row. Re-running the seed would create duplicates; the code reads `rows[0]` / `.single()`. Live DB currently has exactly 1 row each **[DB]**.
- **Fix:** Unique index on a constant expression, e.g. `CREATE UNIQUE INDEX ON website_homepage ((true));`.

---

## 5. Workflow and UX Improvements

| # | Current workflow | Problem | Proposed workflow | Why better | Affected |
|---|---|---|---|---|---|
| W1 | Enquiry → "Create quote" → quote form pre-filled via sessionStorage; no client record; enquiry stays "read" | Clients never get created; enquiries never close; data re-typed | "Convert" action: find-or-create client by email/phone → create draft quote linked to `client_id` + `enquiry_id` → set enquiry `responded` | One click, no duplicates, full traceability | enquiries.tsx, CreateQuoteFromEnquiry, quotes.tsx, new RPC |
| W2 | Quote: edit freely; status buttons Pending/Accepted/Rejected write `status` only | No history, no record of *how* the client responded | Draft (editable) → Sent (locked, token) → Response recorded (online RPC, or admin "Record response" using existing `recordCustomerResponse`) → Revise creates v2 | Immutable sent quotes, complete response log | quotes.tsx, quoteResponses.ts, quoteVersioning.ts |
| W3 | Accepted quote and income record are unrelated except an optional dropdown | No view of what is owed | On accepted quote: "Record payment" pre-fills income with `quote_id`/`client_id`; show Paid / Balance per quote | Distinguishes quoted, received, outstanding | finance.tsx, quotes.tsx, view/RPC |
| W4 | Quotes never expire | Stale prices can be accepted | Nightly job (pg_cron) or check at read/response time sets `expired` past `valid_until` | Prevents accepting outdated prices | DB |
| W5 | CMS save = unpublish | Content vanishes from public site | Save draft (invisible) → Preview → Publish | Safe editing | CMS pages + schema |
| W6 | Client deletion | Cascading loss | Archive (status inactive) + hide from pickers | Reversible | clients.tsx, FK |
| W7 | Notifications per browser | Staff on two devices see different counts | DB `notification_reads` table, plus optional email (Supabase Edge Function + Resend) on new enquiry / quote response | Reliable alerting | NotificationPanel, AdminLayout |
| W8 | Errors via `alert()` / silent `console.error` | Users miss failures | Use the existing `sonner` toasts consistently | Consistent feedback | view.$token.tsx, enquiries.tsx, SendQuoteModal |

---

## 6. Security Assessment

| ID | Vulnerability | Location | Risk | Remediation |
|---|---|---|---|---|
| S1 | Public `/test-env` dumps env config; infra identifiers committed in source | `src/routes/test-env.tsx` | **High** | Delete route; scrub git history if the Cloudinary value is a secret; rotate it |
| S2 | Unguarded `/admin/debug` | `src/routes/admin/debug.tsx` | Medium | Delete |
| S3 | Views `current_quotes`, `quotes_with_responses` created without `security_invoker`; in Postgres these run as the owner and can bypass RLS if anon/authenticated have SELECT | `quotation-workflow-migration.sql:391-410` | **Critical if exposed — [NV]** (anon count = 0, but the table may simply be empty) | `ALTER VIEW … SET (security_invoker = on)` or drop (unused by app); run Supabase Security Advisor |
| S4 | Anonymous direct INSERT on `quote_responses` without token | policy + grant (BUG-09) | Medium | Drop policy/grant |
| S5 | `submit_public_quote_response` returns `SQLERRM` to anon; `validate_quote_token` (anon-executable) mutates access counts | SQL | Low | Generic errors; separate read/write |
| S6 | Password change without re-authentication | settings.tsx | Medium | Re-auth |
| S7 | No server-side rate-limit / bot protection on public forms; helper code is dead; `rate_limit_log` has no SELECT policy so the check could never work | `lib/rateLimit.ts`, `schema-fixed.sql` | Medium (spam/DB-fill) | Supabase Edge Function or DB trigger rate-limit + honeypot/Turnstile |
| S8 | Editors have full DELETE on clients, quotes and CMS | RLS "Admin full access" policies | Medium | Restrict DELETE to owner |
| S9 | Login lockout is React state only | login.tsx | Low | Rely on Supabase Auth rate limits; enable CAPTCHA in Supabase Auth |
| S10 | Session in localStorage (XSS → token theft) | supabase.ts | Low (no `dangerouslySetInnerHTML` with user data found) | Keep CSP tight; consider cookie sessions via `@supabase/ssr` |
| S11 | Dependency vulnerabilities: 11 (6 critical, 5 high) incl. `@tanstack/react-start`, `dompurify`, `vite`, `zod`, `seroval` | package.json | **High** | `npm audit fix`; upgrade TanStack Start/Router together; test |
| S12 | `/health` exposes memory/uptime | `routes/health.tsx` | Low | Return `{status:'ok'}` only |
| S13 | Team management impossible from UI; admins added via raw SQL (risk of mistakes) | admin_users RLS | Low | Edge Function with service role + owner check |

**XSS:** React escaping is used throughout. `dangerouslySetInnerHTML` appears only for static JSON-LD, GA bootstrap and the shadcn chart CSS — not user data **[CODE]**. **SQL injection:** none; all access goes through PostgREST/RPC parameters **[CODE]**. **CSRF:** not applicable to Supabase bearer-token calls; TanStack CSRF middleware is enabled for server functions **[CODE]**. **Secrets:** `.env` is git-ignored and was never committed **[TOOL: git log]**; only the anon key and public identifiers are in the client.

---

## 7. Database Assessment

| # | Issue | Detail | Recommendation |
|---|---|---|---|
| D1 | No reproducible migration history | 25 ad-hoc SQL files, duplicates, one broken file | Adopt Supabase CLI migrations; `supabase db pull` the live schema as the baseline |
| D2 | `quotes.client_id ON DELETE CASCADE` | BUG-02 | `RESTRICT` / `SET NULL` |
| D3 | Revision numbering vs CHECK | BUG-07 | Fix constraint |
| D4 | `MAX()+1` reference generators (`generate_quote_number`, `INC-`, `EXP-`) | Race under concurrent inserts → unique violation | Postgres sequences per year/type |
| D5 | Views bypass RLS (if granted) | S3 | `security_invoker` |
| D6 | No `submissions` DELETE policy, no `client_id` on submissions | Enquiries can't be linked to clients or removed (spam) | Add `client_id` FK, owner DELETE / spam status |
| D7 | Quote line items in JSONB with client-computed totals | Totals can disagree with items | Recompute totals in a trigger |
| D8 | No payment/receivable model | Can't compute outstanding balance | `sum(income where quote_id)` view vs `quotes.total_amount` |
| D9 | Fake singleton constraint | BUG-18 | Unique constant index |
| D10 | Dashboard sums done client-side | Row cap, bandwidth | `get_financial_summary(start,end)` RPC |
| D11 | Phone CHECK `LENGTH>=10` counts spaces/symbols | Inconsistent validation | Normalise digits in a trigger |
| D12 | Missing indexes for common filters: `quotes(status, created_at)`, `submissions(status, created_at)`, `clients(status, created_at)` | Fine at today's size | Add when data grows |
| D13 | Unused `content_blocks`, `rate_limit_log`, the two views | Dead schema | Remove after confirming |

---

## 8. Performance Assessment

| # | Finding | Evidence | Improvement |
|---|---|---|---|
| P1 | `queueQuery` serialises all admin queries; dashboard's "parallel" loads run one by one | `lib/queryQueue.ts` | Remove the queue; use React Query for admin data (caching + dedupe) |
| P2 | Auth check (session + `admin_users` query) repeated 2–3× per navigation | `beforeLoad` + shell + guard | Single check in the shell/context; cache role |
| P3 | Large client chunks: `quotes` 448 KB, `index` 415 KB, `admin` 397 KB, `html2canvas` 195 KB; total JS ≈ 2.5 MB uncompressed | **[TOOL]** build output | Lazy-import jsPDF/html2canvas only on "Download PDF"; lazy-load recharts |
| P4 | Full-table loads with no pagination (enquiries, clients, quotes, finance) | page loaders | Server-side pagination + search |
| P5 | Hero/destination images 110–280 KB JPEG, no responsive sizes | `.output/public/assets` | WebP/AVIF + `srcset`; Cloudinary transforms once integrated |
| P6 | Render **free** plan: instance sleeps → ~30–60 s cold start for first visitor | `render.yaml` | Paid instance, or static/edge deploy |
| P7 | `router.tsx` creates an unconfigured `QueryClient` (no staleTime) — `lib/queryClient.ts` config unused | code | Use the configured client |

---

## 9. Test Results

| Check | Result |
|---|---|
| Unit / integration / E2E / component tests | **None exist.** No test runner, no `test` script. |
| `tsc --noEmit` | **1 error** — `AdminLayout.tsx:67` TS7030 (not all code paths return a value) |
| `eslint .` | 17,056 problems; ~16,982 are Prettier CRLF line endings (Windows checkout). Real issues: 54 `no-explicit-any`, 8 `exhaustive-deps`, 7 `only-export-components`, 4 `no-useless-escape`, 1 `no-constant-condition` (`SendQuoteModal` `client_email \|\| true`), 1 `prefer-const` |
| `npm audit --omit=dev` | 11 vulnerabilities (6 critical, 5 high) |
| `npm run build` | **Passes** in PowerShell (16.5 s). Fails with exit 127 under Git Bash — environment issue, not code |
| Built server HTTP probes **[RUN]** | `/`, `/trade` 200 · `/admin`, `/admin/clients`, `/admin/quotes` **307 → login** · `/admin/debug` **200 (unguarded)** · `/test-env` **200 (public)** · `/health` 200 · unknown URL 404 ✔ |
| Live Supabase as anonymous **[DB]** | submissions, clients, quotes, quote_responses, financial_transactions, expense_transactions, audit_log, rate_limit_log → 0 rows visible ✔ · quote_access_tokens → 401 ✔ · website_homepage / website_settings → 1 published row each |

### Verification matrix

| Feature | Code inspected | Automated test | Browser verified | DB verified | Production verified |
|---|---|---|---|---|---|
| Public pages render | ✔ | — | HTTP only | — | ✘ |
| Enquiry submit (travel/contact) | ✔ | ✘ | ✘ | ✘ | ✘ |
| Trade enquiry failure | ✔ | ✘ | ✘ | constraint per SQL | ✘ |
| Admin route guard / redirect | ✔ | ✘ | HTTP ✔ | — | ✘ |
| RLS blocks anon | ✔ | ✘ | — | ✔ | ✔ (live DB) |
| Quote / finance / CMS CRUD | ✔ | ✘ | ✘ (no login) | ✘ | ✘ |
| Public quote accept/decline | ✔ | ✘ | ✘ (no token) | ✘ | ✘ |
| Password reset email | ✔ | ✘ | ✘ | ✘ | ✘ — depends on Supabase redirect-URL allow-list **[NV]** |
| Cloudinary | n/a — not implemented | | | | |

**To complete verification I need:** a non-production Supabase project (or branch) seeded with test data, an owner and an editor test login, and a sample quote token. With those I can click-test journeys 2–7 end to end without touching real customer records.

### User journeys (code-traced)
1. **New enquiry:** Travel/Contact → works to DB; admin sees it after ≤2 min poll; no email. Trade → **stops at submit (BUG-01)**.
2. **Enquiry → client:** **No path exists.** Client must be re-typed manually; enquiry status updated by hand.
3. **Quote lifecycle:** Create ✔ → edit (overwrites, resets to draft) ⚠ → send (link ✔, WhatsApp to wrong number ✘) → customer responds ✔ (but expired/superseded allowed) → status updates ✔ → notification via poll ✔. Modify-after-send breaks history.
4. **Completed transaction:** No automatic link; owner manually records income and optionally picks the quote ✔; revenue updates ✔; quotes are correctly **not** counted as revenue ✔; no outstanding balance ✘; "Completed Transactions" card counts quotes ✘.
5. **Expense:** Record ✔ → dashboard net + chart reflect it ✔ (owner only).
6. **CMS update:** Services/FAQs/Gallery/Testimonials/Visa ✔. Homepage/Company Info: save unpublishes ✘. SEO: no effect ✘.
7. **Team access:** **Not possible from UI**; requires SQL. Role enforcement at DB ✔ for finance only.

---

## 10. Prioritized Remediation Roadmap

### P0 — Critical
| ID | Task | Modules | Depends on | Size |
|---|---|---|---|---|
| T01 | Fix Trade form → `name` mapping; persist all extra fields (`details JSONB`) | Public, Enquiries, DB | — | S |
| T02 | Change `quotes.client_id` FK to RESTRICT; replace client delete with archive | Clients, DB | T08 | S |
| T03 | Delete `/test-env` and `/admin/debug`; rotate any exposed Cloudinary secret | Security | — | S |
| T04 | Verify & fix views `security_invoker` (or drop); drop anon `quote_responses` insert policy/grant | DB | Supabase access | S |
| T05 | Upgrade vulnerable dependencies (TanStack Start/Router, dompurify, vite, zod) + rebuild | Platform | — | M |
| T06 | Stop CMS save from unpublishing (Homepage, Company Info) | CMS | — | M |
| T07 | Lock sent/accepted quotes from in-place edit | Quotes | — | S |
| T08 | Establish Supabase CLI migrations; pull live schema as baseline | DB | Supabase access | M |

### P1 — High
| ID | Task | Modules | Depends on | Size |
|---|---|---|---|---|
| T09 | Fix revision CHECK; wire "Create revision" UI using `quoteVersioning.ts`; revoke old tokens | Quotes, DB | T07, T08 | M |
| T10 | Harden `submit_public_quote_response` (status, expiry, current version); return response state for public page | Quotes, DB | T08 | M |
| T11 | WhatsApp to client phone (add `client_phone`) | Quotes | — | S |
| T12 | Fix admin SSR redirect + honour `?redirect` | Auth | — | S |
| T13 | Correct dashboard metrics via SQL aggregate RPC | Dashboard, DB | T08 | M |
| T14 | Enquiry → Client conversion + enquiry status sync | Enquiries, Clients, Quotes | T02 | M |
| T15 | Admin "Record response" (phone/WhatsApp/in-person) using `recordCustomerResponse` | Quotes | T10 | S |
| T16 | Settings: re-auth for password change; remove fake preferences | Settings | — | S |
| T17 | Align phone validation (client + DB) | Public, DB | — | S |

### P2 — Medium
| ID | Task | Modules | Depends on | Size |
|---|---|---|---|---|
| T18 | Payment tracking: paid/outstanding per quote; "Record payment" from accepted quote | Finance, Quotes | T13 | M |
| T19 | Quote expiry automation | Quotes, DB | T10 | S |
| T20 | Remove `queueQuery`; move admin data to React Query; single auth check | All admin | — | M |
| T21 | Pagination + server-side search for enquiries/clients/quotes/finance | All admin | T20 | M |
| T22 | Cloudinary signed upload (Edge Function) for CMS images & expense receipts | CMS, Expenses | — | M |
| T23 | Wire SEO CMS into route `head()` | CMS, Public | — | S |
| T24 | Render unused homepage CMS fields (or remove them) | CMS, Home | T06 | S |
| T25 | Team management via Edge Function (invite, role, deactivate) | Team, Auth | — | L |
| T26 | Server-side rate-limit + honeypot/Turnstile on public forms | Public, DB | — | M |
| T27 | Email notifications for new enquiries & quote responses | Notifications | — | M |
| T28 | Restrict DELETE to owners on clients/quotes/CMS | DB | T08 | S |
| T29 | Lazy-load jsPDF/html2canvas/recharts; image optimisation | Performance | — | S |
| T30 | Move off Render free plan (cold starts) | Deploy | — | S |

### P3 — Low
| ID | Task | Size |
|---|---|---|
| T31 | Add test suite (Vitest for helpers, Playwright for the 7 journeys against a test Supabase project) | L |
| T32 | Remove dead code (`rateLimit.ts`, `security.ts` helpers, `api/clients.ts`, unused QueryClient, `content_blocks`) | S |
| T33 | Fix TS7030, `no-explicit-any`, add `.gitattributes` (`* text=auto eol=lf`) to clear 16k CRLF lint errors | S |
| T34 | Header search: implement or remove | S |
| T35 | Notifications read-state in DB | S |
| T36 | Preserve `created_by` on expense edit; soft-delete expenses | S |
| T37 | Sequences for quote/INC/EXP numbers | S |
| T38 | Login audit via trigger/Edge Function; trim `/health` output | S |
| T39 | Split 1,000-line page components | M |
| T40 | Consistent domain (sitemap/robots `…tradecoltd.com` vs fallback `…trade.com` in `quoteTokens.ts`) | S |

---

## 11. Final Assessment

1. **Can it reliably support actual business operations?** **Not yet.** It can capture travel/contact enquiries, keep a client list, log income and expenses, and run the public site. It cannot reliably capture trade leads, send quotes to clients by WhatsApp, protect quote history, or let staff edit website content safely.
2. **Genuinely functional:** public Travel/Contact/About/Gallery pages; Visa Destination Quick Reference (CMS → Travel); enquiries list/status; client CRUD; income records with void; expense records; owner-only finance enforcement; Services/FAQs/Gallery/Testimonials CMS; RLS protection against anonymous access; public token-based quote viewing.
3. **Only appear functional:** Trade enquiry form; WhatsApp "send quote"; quote editing/"modify"; Homepage & Company Info save; SEO CMS; dashboard "Completed Transactions"/"Active Clients"/"Pending Quotes"; settings notification preferences and "current password"; header search; image "upload" fields; quote versioning badge (no versions ever created).
4. **Biggest risks if deployed today:** lost trade revenue (every trade enquiry fails); permanent loss of quote history when a client is deleted; customers accepting quotes whose figures were changed after sending, or that had expired; quotes never reaching customers via WhatsApp; website content disappearing after a CMS save; publicly reachable debug pages and known-vulnerable framework versions.
5. **Must fix before production:** T01–T08, plus T11 and T12.
6. **After the critical fixes:** the quote lifecycle (T09, T10, T15, T19), payments/outstanding balances (T18), correct dashboard metrics (T13), enquiry→client conversion (T14), then performance, Cloudinary, team management and tests.
7. **Recommended order:** T03 → T05 → T08 (baseline migrations) → T01 → T02 → T04 → T06 → T07 → T11 → T12 → T09/T10/T15 → T13 → T14 → T18 → T19 → T20/T21 → T22–T30 → P3.
