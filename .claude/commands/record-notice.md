---
description: After approved external delivery, run node scripts/holds.mjs record-notice --hold=<code> --custodian=<email> --date=YYYY-MM-DD --evidence="<external delivery reference>" --actor="<operator>"
---

After approved external delivery, run node scripts/holds.mjs record-notice --hold=<code> --custodian=<email> --date=YYYY-MM-DD --evidence="<external delivery reference>" --actor="<operator>". Never claim this sends a notice.

Read CLAUDE.md first. Use --json when exact values are needed. Writes require a declared operator and real supporting evidence. Never send, delete or modify a source system.
