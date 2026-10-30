# Legal Holds for Claude Code

One private database per business, one trusted operator. This is a records desk, not a preservation service or custodian portal.

- Read actual command output before answering. Resolve ambiguity with an exact code or email.
- Never send, publish, delete, freeze mailboxes or release source-system preservation. Generated notices and worksheets are drafts for counsel.
- Record only real external evidence. Acknowledgement is not inferred from a draft or a recorded name. Operator and authority labels are not authenticated signatures.
- Counsel defines scope and reviews. IT implements preservation in the source systems. See docs/compliance.md for the limited checks.
- Every mutation uses --actor. Use --dry-run for import previews. Changed imports are rejected for reconciliation. Imported holds stay drafts.
- Release records counsel’s approval and reports overlapping holds. It never changes source systems or deletes evidence.
- Do not expose the owner connection. Database owners can bypass checks. No shared-user authentication is supplied. Keep credentials, evidence and exports outside Git.
- Back up before changing schema. Use additive migrations, temporary demo data and npm test. Never seed a working database.

The one CLI is scripts/holds.mjs. Commands live in .claude/commands/ for Claude Code, Codex, OpenCode and Cursor. There is no second command library. npm run migrate applies migrations. npm run seed adds fictional demo data, only in a disposable database. npm run demo uses a temporary database and removes it after the demonstration.

Use /attention first, then /chase, /departures, /reviews and /compliance. /weekly-review writes from three real command results. /customise changes fields and rules, /new-view adds a read-only report. npm run view and npm run docs use brand.json.

Omni by Enterprise DNA: https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=exterro-legal-hold&utm_medium=readme
