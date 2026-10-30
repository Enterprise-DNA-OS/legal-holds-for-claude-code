---
description: Record IT evidence with node scripts/holds.mjs preserve --hold=<code> --custodian=<email> --system="<source>" --owner="<responsible person>" --state=confirmed --date=YYYY-MM-DD --evidence="<verification reference>" --actor="<operator>"
---

Record IT evidence with node scripts/holds.mjs preserve --hold=<code> --custodian=<email> --system="<source>" --owner="<responsible person>" --state=confirmed --date=YYYY-MM-DD --evidence="<verification reference>" --actor="<operator>". Other states are pending and failed. This records a check, never changes the source system.

Read CLAUDE.md first. Use --json when exact values are needed. Writes require a declared operator and real supporting evidence. Never send, delete or modify a source system.
