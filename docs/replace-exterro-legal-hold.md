# Move the legal hold register from Exterro

Keep source-system preservation operating throughout a migration. This base imports hold metadata only. It does not migrate frozen mailboxes, retained files, notice delivery history, signatures, responses or preservation connectors.

1. Ask your Exterro administrator for a hold register report suitable for export to CSV. The publicly accessible Exterro product page does not document an export menu or standard headers. Confirm the available report with the administrator before planning a switch. If your account cannot provide the register, stop here.
2. Create a CSV containing source ID, matter code, matter name, counsel, jurisdiction, contemplated date, hold code, hold name, scope and next review date. Keep the source report unchanged and document any preparation. Dates are YYYY-MM-DD, jurisdictions NZ, AU or other. The fixture is a fictional mapped example, not a verified native Exterro export.
3. Copy fixtures/exterro-map.json and map its field keys to your report headings. Map every required key. Unknown columns are preserved with the source row. Blank required values, invalid dates, conflicting matters and duplicate hold codes reject the whole import.
4. Run one command, initially with --dry-run:

```bash
node scripts/holds.mjs import exterro imports/holds.csv --map=imports/map.json --actor="Migration owner" --dry-run
```

Repeat without --dry-run after reconciling the preview. Identical source rows are skipped on repeat imports. Changed rows require deliberate reconciliation instead of silently overwriting local work. All imported holds start as drafts. No incoming status becomes proof of preservation.

5. Compare hold and matter counts, codes, scopes, source IDs and retained source rows. Use export to create a complete JSON archive. Add custodians and assignments, then record evidence of externally issued notices, acknowledgements and actual preservation work. Activation checks the minimum evidence. Keep both registers until counsel and IT approve the reconciliation.

The one-command import begins after report preparation and column mapping. A complete legal hold migration is not promised in a day. Do not cancel Exterro or release source-system holds merely because the register imported successfully.

Product and scope source, checked 2026-10-30: https://www.exterro.com/e-discovery-software/legal-hold . No public native header contract was located this run. Do not describe the fixture as vendor-generated.
