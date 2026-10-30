---
description: Only after counsel authorises the exact hold, run node scripts/holds.mjs release --hold=<code> --date=YYYY-MM-DD --authority="<counsel>" --evidence="<approval reference>" --actor="<operator>"
---

Only after counsel authorises the exact hold, run node scripts/holds.mjs release --hold=<code> --date=YYYY-MM-DD --authority="<counsel>" --evidence="<approval reference>" --actor="<operator>". Report every remaining overlapping hold. This closes the local register entry, never deletes content or releases source-system preservation.

Read CLAUDE.md first. Use --json when exact values are needed. Writes require a declared operator and real supporting evidence. Never send, delete or modify a source system.
