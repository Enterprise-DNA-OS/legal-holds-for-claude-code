#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {run,reads} from './lib/domain.mjs';
const opts={},pos=[];
for(const a of process.argv.slice(2)){if(a.startsWith('--')){const i=a.indexOf('=');opts[a.slice(2,i<0?undefined:i)]=i<0?true:a.slice(i+1);}else pos.push(a);}
let [cmd,...args]=pos;
function format(v){if(Array.isArray(v)){if(!v.length)return '(none)';if(v[0]?.question)return v.map(x=>x.question+'\n'+format(x.rows)).join('\n\n');const keys=Object.keys(v[0]);const cell=x=>x===null?'':typeof x==='object'?JSON.stringify(x):String(x);return [keys.join(' | '),keys.map(()=>'---').join(' | '),...v.map(x=>keys.map(k=>cell(x[k])).join(' | '))].join('\n');}if(v&&typeof v==='object')return Object.entries(v).map(([k,x])=>k+':\n'+format(x)).join('\n\n');return String(v??'');}
if(!cmd||cmd==='help'){console.log('Reads: '+Object.keys(reads).join(', ')+', hold, attention, insights\nWrites: add-matter, add-hold, add-custodian, assign, record-notice, acknowledge, preserve, activate, review, release, log, import\nFiles: export --out=path, draft-notice --hold=code, draft-chase, weekly-review\nEvery write requires --actor=name. Flags use --name=value. --json and --dry-run supported.');process.exit(0);}
let db;
try{db=await getDb();let data;
 if(['draft-notice','draft-chase','weekly-review'].includes(cmd)){
 data=cmd==='draft-notice'?await run(db,'hold',[],opts):cmd==='draft-chase'?await run(db,'chase'): {reviews:await run(db,'reviews'),chase:await run(db,'chase'),preservation:await run(db,'preservation')};
 const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`${cmd}-${Date.now()}.md`);
 fs.writeFileSync(file,`# DRAFT: ${cmd}\n\nFor counsel review. Nothing has been sent. Preserve the scoped records in their original systems and pause routine deletion only under approved instructions. The register does not implement preservation.\n\n${format(data)}\n`,{flag:'wx'});data={file};
 }else data=await run(db,cmd,args,opts);
 if(cmd==='export'&&opts.out){fs.writeFileSync(path.resolve(opts.out),JSON.stringify(data,null,2)+'\n',{flag:'wx'});console.log(opts.json?JSON.stringify({file:opts.out}):`Export: ${opts.out}`);}
 else console.log(opts.json?JSON.stringify(data,null,2):format(data));
}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
