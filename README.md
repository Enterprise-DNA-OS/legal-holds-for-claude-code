# Legal Holds for Claude Code

Your hold register, acknowledgement queue and preservation evidence in a database you own. Built for a trusted legal operations desk recording work performed by counsel and IT.

## Three ways to use it

- **Do it yourself:** free MIT-licensed source. Install Node 20 or later, run the demo and use Claude Code, Codex, OpenCode or Cursor with the same commands. Agent subscriptions and hosting are separate.
- **We customise it:** Enterprise DNA maps your Exterro records and builds your fields, rules, access controls and connected checks. One setup fee, then a retainer for ongoing work.
- **We run it for you:** installation, controlled access, backups and the weekly records review through Omni by Enterprise DNA. One setup fee, then a retainer.

[Book 30 minutes with Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=exterro-legal-hold&utm_medium=readme).

## The bill and the scope

Exterro Inc.'s [AWS Marketplace offer](https://aws.amazon.com/marketplace/pp/prodview-j2cwwxg2sz22a) lists US$94,535 for a 12-month base package with 75 holds, five users, SSO and one HR CSV source, checked 30 October 2026. This is a public vendor offer, not a verified bill from an NZ/AU customer. The free base replaces record administration only. It does not replicate Exterro's notice delivery, authenticated portal or live preservation connectors.

It holds matters, custodians, hold scopes, assignments, notice references, acknowledgements, preservation evidence, review dates and recorded releases. Counsel remains responsible for the legal scope and IT for actual preservation. No notice is sent. No source data is frozen or released. Local actor names are audit labels, not verified identities.

## Start with fictional data

```bash
npm install
npm test
npm run demo
```

The demo uses a disposable embedded PGlite database, renders sample documents and removes it when finished. For an empty working database, run npm run migrate. DATABASE_URL chooses private Postgres. With it unset, DATA_DIR chooses local embedded storage. Never run seed against a working database. To explore the fictional records persistently, choose a separate DATA_DIR, leave DATABASE_URL empty, then run npm run seed.

```bash
node scripts/holds.mjs attention
node scripts/holds.mjs insights --json
npm run view
npm run docs
```

## The weekly jobs

/attention shows the work queue. /chase finds missing responses. /departures gives the preservation handover for people leaving. /reviews finds counsel reviews. /overlaps names people on more than one hold. /weekly-review writes a local draft from reviews, chase and preservation results. /compliance checks record gaps against the sourced local rules in docs/compliance.md.

Draft instructions, counsel worksheets and overlap-release worksheets are branded HTML under docs-out/. Read-only week and departure reports go under views/. Put the business name, colours and logo path in brand.json. These are private snapshots with no editing controls or live preservation status.

## Commands

- /matters: List matters, counsel and jurisdictions. Run node scripts/holds.mjs matters.
- /holds: List holds, review dates and response counts. Run node scripts/holds.mjs holds.
- /custodians: List recorded people and departure dates. Run node scripts/holds.mjs custodians.
- /hold: Read one hold and its assignment evidence. Run node scripts/holds.mjs hold "<code or name>". Ambiguous results require a specific selection.
- /chase: Find outstanding acknowledgements and missing notice evidence. Run node scripts/holds.mjs chase. Draft only, never send.
- /preservation: Inspect recorded preservation status. Run node scripts/holds.mjs preservation. These are recorded checks, not live mailbox holds.
- /departures: Prepare the departure preservation handover. Run node scripts/holds.mjs departures. Confirm every source with IT before offboarding.
- /reviews: Find upcoming counsel reviews. Run node scripts/holds.mjs reviews. Local review dates are not court deadlines.
- /overlaps: Find people on multiple unreleased holds. Run node scripts/holds.mjs overlaps. Never release source content based on one local hold.
- /compliance: Run node scripts/holds.mjs compliance. Explain rule IDs using docs/compliance.md. Findings are record gaps, not a legal opinion or proof of compliance.
- /attention: Run node scripts/holds.mjs attention. Summarise overdue acknowledgements, missing preservation evidence, reviews and departures.
- /insights: Run node scripts/holds.mjs insights. Answer the ten cross-record questions with actual results. Do not invent vendor limitations.
- /history: Run node scripts/holds.mjs history. Actor names are declared labels and history is append-only under ordinary database access.
- /add: Create a draft hold with node scripts/holds.mjs add-hold --matter=<code> --code=<unique> --name="<name>" --scope="<counsel scope>" --due=YYYY-MM-DD --actor="<operator>". Obtain real scope from counsel. Nothing is sent.
- /add-matter: Run node scripts/holds.mjs add-matter --code=<unique> --name="<matter>" --counsel="<name>" --jurisdiction=NZ --date=YYYY-MM-DD --actor="<operator>". Date is when proceedings were contemplated. Use AU or other when appropriate.
- /add-custodian: Run node scripts/holds.mjs add-custodian --email=<email> --name="<name>" --department="<department>" --actor="<operator>" with optional --leaving=YYYY-MM-DD.
- /assign: Run node scripts/holds.mjs assign --hold=<code> --custodian="<name or email>" --due=YYYY-MM-DD --actor="<operator>". The due date is chosen by the operator, not a statutory period.
- /record-notice: After approved external delivery, run node scripts/holds.mjs record-notice --hold=<code> --custodian=<email> --date=YYYY-MM-DD --evidence="<external delivery reference>" --actor="<operator>". Never claim this sends a notice.
- /acknowledge: Record existing response evidence with node scripts/holds.mjs acknowledge --hold=<code> --custodian=<email> --date=YYYY-MM-DD --evidence="<response reference>" --actor="<operator>". Do not acknowledge on someone else’s behalf or infer assent.
- /preserve: Record IT evidence with node scripts/holds.mjs preserve --hold=<code> --custodian=<email> --system="<source>" --owner="<responsible person>" --state=confirmed --date=YYYY-MM-DD --evidence="<verification reference>" --actor="<operator>". Other states are pending and failed. This records a check, never changes the source system.
- /activate: Run node scripts/holds.mjs activate --hold=<code> --actor="<operator>" after confirming the assignment and preservation evidence. This changes local register status only.
- /review: Run node scripts/holds.mjs review --hold=<code> --date=YYYY-MM-DD --due=YYYY-MM-DD --evidence="<counsel review reference>" --actor="<operator>". Record counsel’s actual next review date.
- /release: Only after counsel authorises the exact hold, run node scripts/holds.mjs release --hold=<code> --date=YYYY-MM-DD --authority="<counsel>" --evidence="<approval reference>" --actor="<operator>". Report every remaining overlapping hold. This closes the local register entry, never deletes content or releases source-system preservation.
- /log: Run node scripts/holds.mjs log --hold=<code> --body="<factual note>" --actor="<operator>". Notes cannot be rewritten. Add a correction as a new note.
- /import: Read docs/replace-exterro-legal-hold.md first. Use node scripts/holds.mjs import exterro <CSV> --map=<JSON> --actor="<operator>" --dry-run. Reconcile before repeating without dry-run. All imported holds are drafts. Native export headers are unverified.
- /export: Run node scripts/holds.mjs export --out=exports/<unique-name>.json. Create exports/ if needed. The full JSON includes evidence references, source rows and history. Keep it private. Existing files are never overwritten.
- /draft-notice: Run node scripts/holds.mjs draft-notice --hold=<code>. Read and tailor the draft in drafts/ to counsel’s scope. Nothing sends. The draft is not evidence of notification.
- /draft-chase: Run node scripts/holds.mjs draft-chase. Summarise missing acknowledgements from the generated draft in drafts/. Counsel reviews the exact wording. Never send.
- /weekly-review: Run node scripts/holds.mjs reviews, chase and preservation, then node scripts/holds.mjs weekly-review. Summarise the three actual results and retain the draft in drafts/. Do not infer a live hold from recorded confirmation.
- /view: Run npm run view. Open the read-only snapshot in views/. It does not update records.
- /documents: Run npm run docs. Inspect the draft hold instructions, counsel review and release-overlap worksheets in docs-out/. All are drafts requiring counsel review.

/customise adds fields or rules through a tested migration. /new-view adds a read-only report. All write examples use --name=value flags and need --actor. All reads support --json. Names are case-insensitive and IDs accept unambiguous prefixes. Ambiguous matches list choices and exit with an error. Mutations and imports are transactional. Notes and history are append-only under ordinary access.

## Bring your register across

Read [the Exterro switching guide](docs/replace-exterro-legal-hold.md). Native Exterro export headings were not publicly verifiable. The import needs your administrator's report and an explicit column map. It preserves source rows, rejects changed reimports and leaves holds as drafts. It does not migrate frozen data or prove that notices were delivered.

```bash
node scripts/holds.mjs import exterro fixtures/exterro-mapped.csv --map=fixtures/exterro-map.json --actor="Demo operator" --dry-run
```

A one-command metadata import follows mapping and reconciliation. Full preservation migration is not promised in a day. Keep source preservation operating throughout. Export produces a complete private JSON archive including history, with no overwrite of existing files.

## Ten questions answered from your records

/insights answers these today. They are cross-record questions supported by this base, not a claim that Exterro cannot produce custom reports.

1. Which departing custodians have no confirmed preservation?
2. Which people are attached to more than one unreleased hold?
3. Which overdue acknowledgements concern people leaving soon?
4. Which matters have holds with no custodians?
5. Which preservation confirmations need fresh evidence?
6. Which counsel have overdue hold reviews?
7. Which people acknowledged a notice but have no confirmed preservation?
8. Which system owners have failed or pending preservation work?
9. Which matters have the largest acknowledgement backlog?
10. Which imported holds still await activation review?

## Your first hour: ten things to ask for

1. Show the acknowledgements we still need.
2. Find people leaving this month who have no preservation confirmation.
3. Tell me which holds overlap for Maya.
4. List every failed preservation check.
5. Show reviews due this week.
6. Draft a hold instruction for counsel.
7. Draft the weekly records review.
8. Put our business name on the worksheets.
9. Add our external matter reference through /customise.
10. Make a department view through /new-view.

## Verification and boundaries

npm test checks every read and mutation, failed activation, acknowledgement sequencing, evidence requirements, overlapping release, repeat import, rollback, malformed CSV, dry runs, ambiguity, append-only history, database permissions, drafts, exports and escaped HTML. Local tests run on Linux with PGlite. The manual GitHub workflow defines Windows/Linux and Postgres jobs. A matrix definition is not a claim that those platforms ran this session.

See [compliance checks](docs/compliance.md), [selection evidence](docs/research.md) and [why there is no front end](docs/why-no-front-end.md). Protect the database owner connection, private backups and report files. This base does not supply a multi-user portal or authenticated approval service.
