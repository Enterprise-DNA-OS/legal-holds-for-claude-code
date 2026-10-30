import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {getDb,REPO_ROOT} from './lib/db.mjs';import {migrate} from './migrate.mjs';import {seed} from './seed.mjs';import {run,reads,questions,day,match} from './lib/domain.mjs';import {parseCsv} from './lib/csv.mjs';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'legal-holds-test-'));
process.env.DATA_DIR=path.join(temp,'db');process.env.DATABASE_URL=process.env.TEST_DATABASE_URL||'';process.env.OUTPUT_DIR=temp;
const db=await getDb();let checks=0;const ok=(x)=>{assert.ok(x);checks++;};const eq=(x,y)=>{assert.deepEqual(x,y);checks++;};
const rejects=async(fn,re)=>{await assert.rejects(fn,re);checks++;};
const actor='Test Operator',date=new Date().toISOString().slice(0,10);const schema='test_holds_'+Date.now();
try{
 if(db.mode==='postgres'){await db.exec(`create schema ${schema}; set search_path to ${schema}`);}
 eq((await migrate(db)).ran.length,1);eq((await migrate(db)).ran.length,0);await seed(db);await seed(db);eq((await run(db,'holds')).length,3);
 for(const cmd of Object.keys(reads))ok(Array.isArray(await run(db,cmd)));
 eq((await run(db,'insights')).length,10);eq(questions.length,10);ok((await run(db,'attention')).departures.length>0);
 eq((await run(db,'hold',['h-101'])).hold.code,'H-101');eq((await match(db,'custodians','MAYA')).name,'Maya Chen');
 await rejects(()=>match(db,'holds','harbour'),/Ambiguous/);await rejects(()=>match(db,'holds',"' OR 1=1"),/No holds match/);
 assert.throws(()=>day('2026-02-30'));checks++;
 await rejects(()=>run(db,'activate',[],{actor,hold:'H-103'}),/Activation blocked/);
 await rejects(()=>run(db,'acknowledge',[],{actor,hold:'H-102',custodian:'maya',date,evidence:'ack'}),/notice evidence/);
 await rejects(()=>run(db,'preserve',[],{actor,hold:'H-101',custodian:'maya',system:'Mailbox',owner:'IT',state:'confirmed',date}),/evidence/);
 const m=await run(db,'add-matter',[],{actor,code:'M-TEST',name:'Test matter',counsel:'Counsel',jurisdiction:'NZ',date});ok(m.id);
 const c=await run(db,'add-custodian',[],{actor,email:'Test@Example.test',name:'Test Person',department:'Test'});eq(c.email,'test@example.test');
 const h=await run(db,'add-hold',[],{actor,matter:'M-TEST',code:'H-TEST',name:'Test hold',scope:'Test records',due:date});eq(h.status,'draft');
 await run(db,'assign',[],{actor,hold:'H-TEST',custodian:'test@example.test',due:date});
 await rejects(()=>run(db,'assign',[],{actor,hold:'H-TEST',custodian:'test@example.test',due:date}),/unique|duplicate/);
 await run(db,'record-notice',[],{actor,hold:'H-TEST',custodian:'Test Person',date,evidence:'external-message-ref'});
 await run(db,'acknowledge',[],{actor,hold:'H-TEST',custodian:'Test Person',date,evidence:'external-ack-ref'});
 await run(db,'preserve',[],{actor,hold:'H-TEST',custodian:'Test Person',system:'Drive',owner:'IT',state:'confirmed',date,evidence:'verified-preservation-ref'});
 eq((await run(db,'activate',[],{actor,hold:'H-TEST'})).status,'active');
 await run(db,'review',[],{actor,hold:'H-TEST',date,due:date,evidence:'review-ref'});
 const note=await run(db,'log',[],{actor,hold:'H-TEST',body:'<script>alert(1)</script>'});ok(note.id);
 await rejects(()=>db.query('update notes set body=$1 where id=$2',['changed',note.id]),/Append-only/);
 await rejects(()=>db.exec('delete from audit_log'),/Append-only/);
 await rejects(()=>run(db,'release',[],{actor,hold:'H-TEST',date,authority:'Counsel'}),/evidence/);
 const rel=await run(db,'release',[],{actor,hold:'H-101',date,authority:'Counsel',evidence:'release-approval'});ok(rel.remaining_holds.some(x=>x.remaining_hold==='H-102'));
 eq((await db.query('select count(*)::int as n from preservations'))[0].n,4);
 await rejects(()=>run(db,'log',[],{actor,hold:'H-101',body:'changed'}),/read-only/);
 const pre=(await run(db,'holds')).length;
 await run(db,'add-hold',[],{actor,matter:'M-TEST',code:'DRY',name:'Dry run',scope:'Records',due:date,'dry-run':true});eq((await run(db,'holds')).length,pre);
 const csv=path.join(REPO_ROOT,'fixtures/exterro-mapped.csv'),map=path.join(REPO_ROOT,'fixtures/exterro-map.json');
 eq((await run(db,'import',['exterro',csv],{actor,map,'dry-run':true})).imported,1);eq((await run(db,'holds')).length,pre);
 eq((await run(db,'import',['exterro',csv],{actor,map})).imported,1);eq((await run(db,'import',['exterro',csv],{actor,map})).unchanged,1);
 const original=fs.readFileSync(csv,'utf8');const changed=path.join(temp,'changed.csv');fs.writeFileSync(changed,original.replace('Example correspondence','Changed correspondence'));
 await rejects(()=>run(db,'import',['exterro',changed],{actor,map}),/Changed source/);
 const bad=path.join(temp,'bad.csv');const header=original.split('\n')[0];const goodRow=original.trim().split('\n')[1].replaceAll('501','502');fs.writeFileSync(bad,header+'\n'+goodRow+'\n'+goodRow.replaceAll('502','503').replace('2026-01-01','2026-02-30')+'\n');
 const before=(await run(db,'holds')).length;await rejects(()=>run(db,'import',['exterro',bad],{actor,map}),/real date/);eq((await run(db,'holds')).length,before);
 eq(parseCsv('\uFEFFName,Note\r\n"A, B","Line 1\nLine ""2"""')[0].Note,'Line 1\nLine "2"');
 assert.throws(()=>parseCsv('A,A\n1,2'));assert.throws(()=>parseCsv('A,B\n1'));checks+=2;
 const exported=await run(db,'export');eq(exported.format,'legal-holds-v1');ok(exported.audit_log.length>=10);ok(exported.holds.some(x=>x.source_data?.['Source ID']==='EX-501'));
 // Test public-role denial, without external auth or network services.
 await db.exec('create role holds_test_reader');await db.exec('set role holds_test_reader');
 await rejects(()=>db.query('select * from holds'),/permission denied/);await db.exec('reset role');await db.exec('drop role holds_test_reader');
 if(db.mode==='postgres'){await db.exec(`drop schema ${schema} cascade`);}await db.close();
 // CLI and render tests always use their own fresh embedded database.
 const env={...process.env,DATABASE_URL:'',DATA_DIR:path.join(temp,'cli-db')};
 const cli=(args,status=0)=>{const p=spawnSync(process.execPath,args,{cwd:REPO_ROOT,env,encoding:'utf8'});assert.equal(p.status,status,p.stderr);checks++;return p.stdout;};
 cli(['scripts/seed.mjs']);
 for(const cmd of Object.keys(reads))JSON.parse(cli(['scripts/holds.mjs',cmd,'--json']));
 for(const cmd of ['hold','attention','insights','export'])JSON.parse(cli(['scripts/holds.mjs',cmd,...(cmd==='hold'?['H-101']:[]),'--json']));
 cli(['scripts/holds.mjs','help']);cli(['scripts/holds.mjs','hold','Harbour'],1);
 for(const cmd of ['draft-notice','draft-chase','weekly-review']){const out=JSON.parse(cli(['scripts/holds.mjs',cmd,'--hold=H-101','--json']));ok(fs.readFileSync(out.file,'utf8').includes('Nothing has been sent'));}
 cli(['scripts/holds.mjs','export','--out='+path.join(temp,'export.json')]);cli(['scripts/holds.mjs','export','--out='+path.join(temp,'export.json')],1);
 cli(['scripts/holds.mjs','log','--hold=H-101','--actor=Test','--body=<script>alert(1)</script>']);
 cli(['scripts/holds.mjs','add-hold','--matter=M-101','--code=XSS','--name=<script>alert(1)</script>','--scope=Records','--due='+date,'--actor=Test']);
 cli(['scripts/view.mjs']);cli(['scripts/docs.mjs']);
 const html=fs.readFileSync(path.join(temp,'views/week.html'),'utf8');ok(html.includes('&lt;script&gt;'));ok(!html.includes('<script>'));eq(fs.readdirSync(path.join(temp,'docs-out')).length,3);
 console.log(`PASS: ${checks} checks; every read and mutation, import rollback/repeats, overlap release, drafts, escaped reports, append-only history and database permissions.`);
}catch(e){try{await db.close();}catch{}throw e;}finally{fs.rmSync(temp,{recursive:true,force:true});}
