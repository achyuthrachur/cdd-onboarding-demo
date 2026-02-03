Below is a start-to-finish project plan you can hand to Claude Code. It’s written as an implementation-ready blueprint (architecture + milestones + concrete tickets), assuming Next.js on Vercel and Syncfusion Spreadsheet (Option A) for the Excel-like experience.



0) Goal and success criteria

Goal

Deliver a single web app that runs Stages 1–4 end-to-end for the BofA synthetic scenarios:

Upload/choose docs → run gap assessments + attribute extraction
Load population → configure sampling → lock sample
Generate “Excel-like” workbooks in-app → assign → complete → export/import if needed
Consolidate results → dashboard → generate report artifacts

Demo success criteria (what must work smoothly)

A demo user can create an Audit Run, pick a scenario package, click through the 4 stages, and end with a consolidated report in one interface.
Stage 3 is a true spreadsheet UI (Syncfusion) that looks/feels like Excel.
Everything is persisted: refresh page, nothing disappears.



1) Tech stack and architecture

Frontend

Next.js (App Router) on Vercel
UI components (ShadCN or similar)
Syncfusion React Spreadsheet for Stage 3 workbook UI
File upload components + “scenario package” selector
Auth (simple demo auth initially; expand later)

Backend (in Next.js API routes)

/api/ai/* routes to call ChatGPT for Stage 1
/api/sampling/* for sampling inputs/outputs
/api/workbooks/* for workbook template creation + persistence + export/import
/api/report/* for consolidation + report generation

Storage + DB

DB: Postgres (Neon/Supabase)
File storage: Vercel Blob / S3 / Supabase Storage
Optional: background jobs (Upstash QStash / serverless queue) if needed, but keep synchronous for demo where possible

Key design decision: “AuditRun” as the root entity

Everything is keyed by audit_run_id so the UI stays unified.



2) Data model (tables + key fields)

audit_runs

id, name, status, created_by, created_at
scenario_id (optional), scope (json: jurisdictions, audit period, etc.)

documents

id, audit_run_id, doc_type (global_std_old, global_std_new, flu_global, flu_jurisdiction_x, etc.)
jurisdiction (nullable), file_url, file_hash, uploaded_at

stage1_results

id, audit_run_id, jurisdiction (nullable)
comparison_type (std_vs_std, std_vs_flu)
gaps_json (structured), attributes_json (structured), notes, version, created_at

population_files

id, audit_run_id, file_url, file_hash, schema_json, created_at

samples

id, audit_run_id
method (random/stratified/etc.), config_json, seed, locked_at
sample_items_json (or normalized to a sample_items table)

workbooks

id, audit_run_id, auditor_id (nullable), status
template_version, syncfusion_state_json (or workbook JSON), export_xlsx_url (nullable)
created_at, submitted_at

workbook_rows (optional normalization)

If you need analytics without parsing spreadsheet state:

workbook_id, sample_item_id, attribute_id, fields_json, status, updated_at

consolidations

id, audit_run_id, results_json, metrics_json, generated_at

reports

id, audit_run_id, report_pdf_url, supporting_xlsx_url, created_at



3) Stage-by-stage functional plan

Stage 1 — Gap assessments + attribute extraction

UI

Document manager: upload/select the docs for:

Global Std old vs new
Global Std vs FLU
Per-jurisdiction variants (repeat)
“Run analysis” buttons per comparison
Results viewer:

Gap table (filterable)
Attribute list (exportable)
Approve / Send back + notes

Backend

POST /api/ai/gap-assessment

inputs: doc IDs, comparison type, jurisdiction
output: structured gaps JSON (with references to source sections)
POST /api/ai/attribute-extraction

inputs: FLU doc ID(s)
output: attributes JSON: {attribute_name, acceptable_docs, test_steps, jurisdiction, …}

Prompt/output requirements (important)

Force JSON schema output (strict)
Store provenance for demo credibility:

source_doc, section_id/page, quoted_snippet (short)

Deliverable: Stage 1 works end-to-end and persists results.



Stage 2 — Sampling

UI

“Get population from automation” (for demo: upload CSV/Excel + later hook to automation)
Schema preview + column mapping
Sampling configuration panel:

method (random/stratified)
strata columns / weights
exclusions (filters)
sample size
seed
Preview sample, then “Lock sample”

Backend

POST /api/sampling/ingest-population

parse file, infer schema, persist metadata
POST /api/sampling/run

returns sample set
POST /api/sampling/lock

prevents changes unless “unlock” w/ version bump

Deliverable: Sampling generates deterministic locked sample set.



Stage 3 — Workbook generation + auditor workflow (Syncfusion)

UI

Workbook list: one workbook per auditor or per jurisdiction (configurable)
“Generate workbooks” button:

uses Stage 1 attributes + Stage 2 sample
Syncfusion Spreadsheet screen:

tabs/sheets: e.g. Overview, Testing, Exceptions, Evidence Checklist
validations: dropdowns, required fields
computed summary cells (pass rate, open items, etc.)
Actions:

Assign auditor
Save draft
Submit
Export XLSX (optional but recommended)
Import XLSX (optional for offline completion)

Workbook template strategy (critical)

Implement a Workbook Builder service that:

accepts {attributes, sample_items, jurisdiction}
outputs initial spreadsheet content:

sheets, headers, rows, dropdown validations, formulas
also outputs a “row map” (sample item ↔ row indices) for consolidation

Backend

POST /api/workbooks/generate
POST /api/workbooks/save-state (stores Syncfusion JSON/state)
POST /api/workbooks/submit
GET /api/workbooks/:id/export-xlsx (optional)
POST /api/workbooks/:id/import-xlsx (optional)

Deliverable: Excel-like workbook is fully usable in-browser and tied to audit run.



Stage 4 — Consolidation + reporting

UI

Consolidation dashboard:

metrics: pass/fail counts, exceptions by jurisdiction/attribute, missing evidence
table of findings with filters
“Generate report”:

produces PDF + optional supporting workbook export
Download links + audit trail

Backend

POST /api/report/consolidate

reads workbook state(s) and normalizes results
POST /api/report/generate

generates PDF (HTML → PDF) and stores artifacts

Deliverable: One-click consolidation and report artifact generation.



4) Project milestones (recommended build order)

Milestone 1 — App foundation (1–2 days)

Repo setup, Next.js, DB, storage, auth-lite
Create AuditRun CRUD
Stage navigation scaffold (wizard + tabs)

Milestone 2 — Stage 1 (2–4 days)

Document upload + storage + doc typing
AI routes for gap + extraction
Results UI + persistence

Milestone 3 — Stage 2 (2–3 days)

Population ingest (CSV/Excel)
Sampling UI + deterministic sampling logic
Lock sample + preview

Milestone 4 — Stage 3 (4–7 days)

Syncfusion integration screen
Workbook Builder (template + validations + formulas)
Persist spreadsheet state
Assignment + submit workflow
Optional: export/import XLSX

Milestone 5 — Stage 4 (3–5 days)

Consolidation parser (from workbook state)
Dashboard + metrics
PDF report generation + downloads

Milestone 6 — Demo mode + polish (2–4 days)

Scenario packages: one-click load docs + population + preconfigured scope
“Run full pipeline” demo button (sequenced calls)
UX polish: progress indicators, error handling, versioning



5) Detailed engineering task list (ticket-style)

Foundation

 DB schema + migrations
 Storage wrapper (upload, signed URLs, hashing)
 AuditRun pages: list/detail, stage routing

Stage 1

 Document type taxonomy + UI to tag docs
 /api/ai/gap-assessment JSON schema + validation
 /api/ai/attribute-extraction JSON schema + validation
 Results UI: gaps table + attributes table + notes + approval

Stage 2

 Population ingest parser (CSV + XLSX)
 Column mapping UI (if needed)
 Sampling module ported into React
 Locking/versioning rules

Stage 3

 Syncfusion Spreadsheet integration + save/load state
 Workbook Builder v1:

sheets + headers + rows
dropdown validations (pass/fail, evidence types)
summary calculations
 Workbook assignment + status
 Submit gating (required fields)
 Export XLSX (optional but recommended)
 Import XLSX (optional)

Stage 4

 Parse workbook state → normalized rows
 Consolidation metrics generator
 Dashboard UI + finding drilldowns
 Report generator (HTML template → PDF) + artifact storage

Demo mode

 Scenario package loader (pre-seeded docs + population)
 “Guided run” sequence button
 Seeded example outputs if AI rate-limits (fallback)



6) Non-functional requirements (so it doesn’t blow up mid-demo)

Reliability

Cache Stage 1 AI outputs by doc hash + prompt version
Store intermediate outputs frequently (especially Stage 3 spreadsheet state)

Security (demo-level, but don’t ignore)

Auth gate all audit runs
Signed URLs for file access
Don’t log raw doc contents in server logs

Performance

Large docs: upload once, hash, reuse
Large populations: stream parse; store only needed columns for sampling

Observability

Simple audit logs (who ran what, when)
Error surfacing in UI (not just console)



7) “Definition of done” for Claude Code

The project is done when:

A user can open the app, create/select an Audit Run, and complete Stages 1–4 without leaving the UI.
Stage 3 feels like Excel (Syncfusion), persists edits, and supports submit + consolidation.
Report artifacts are generated and downloadable.
Demo mode loads a synthetic scenario and completes the flow smoothly.



If you want, I can also provide Claude Code a Workbook Template Spec v1 (sheet names, columns, dropdown options, required fields, summary formulas) based on how your current VBA workbook is structured—just describe the sheets/columns you have today.