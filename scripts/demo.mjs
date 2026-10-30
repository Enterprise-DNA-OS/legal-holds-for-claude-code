import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'legal-holds-demo-'));
const env={...process.env,DATABASE_URL:'',DATA_DIR:path.join(temp,'db'),OUTPUT_DIR:temp};
try{for(const args of [['scripts/seed.mjs'],['scripts/holds.mjs','chase'],['scripts/holds.mjs','departures'],['scripts/holds.mjs','compliance'],['scripts/view.mjs'],['scripts/docs.mjs']]){const p=spawnSync(process.execPath,args,{env,encoding:'utf8'});process.stdout.write(p.stdout);if(p.status!==0)throw Error(p.stderr);}console.log('Demo PASS. Fictional data only.');}finally{fs.rmSync(temp,{recursive:true,force:true});}
