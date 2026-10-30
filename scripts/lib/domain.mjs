import fs from 'node:fs';
import {parseCsv} from './csv.mjs';
export const reads={
 'matters':'select * from matters order by code',
 'holds':'select * from v_holds order by code',
 'custodians':'select * from custodians order by name',
 'chase':'select * from v_chase order by response_due,hold,custodian',
 'preservation':'select * from v_preservation order by hold,custodian,system_name',
 'departures':'select * from v_departures order by leaving_on,hold',
 'compliance':'select * from v_compliance order by hold,rule,finding',
 'reviews':"select code,name,review_due,status from holds where status<>'released' and review_due<=current_date+30 order by review_due",
 'overlaps':"select c.name,c.email,count(*)::int as holds,string_agg(h.code,', ' order by h.code) as hold_codes from assignments a join holds h on h.id=a.hold_id join custodians c on c.id=a.custodian_id where h.status<>'released' group by c.id having count(*)>1 order by c.name",
 'history':'select action,entity_id,actor,detail,created_at from audit_log order by created_at,id'
};
export const questions=[
 ['Which departing custodians have no confirmed preservation?',"select name,hold,leaving_on from v_departures where confirmations=0 order by leaving_on,hold"],
 ['Which people are attached to more than one unreleased hold?',reads.overlaps],
 ['Which overdue acknowledgements concern people leaving soon?',"select c.name,h.code,a.response_due,c.leaving_on from assignments a join holds h on h.id=a.hold_id join custodians c on c.id=a.custodian_id where h.status<>'released' and a.acknowledged_on is null and a.response_due<current_date and c.leaving_on<=current_date+30 order by c.name,h.code"],
 ['Which matters have holds with no custodians?',"select m.code as matter,h.code as hold from holds h join matters m on m.id=h.matter_id where h.status<>'released' and not exists(select 1 from assignments a where a.hold_id=h.id) order by m.code,h.code"],
 ['Which preservation confirmations need fresh evidence?',"select hold,custodian,system_name,checked_on from v_preservation where attention='evidence review due' order by hold,custodian"],
 ['Which counsel have overdue hold reviews?',"select m.counsel,h.code,h.review_due from holds h join matters m on m.id=h.matter_id where h.status<>'released' and h.review_due<current_date order by m.counsel,h.code"],
 ['Which people acknowledged a notice but have no confirmed preservation?',"select h.code,c.name from assignments a join holds h on h.id=a.hold_id join custodians c on c.id=a.custodian_id where h.status<>'released' and a.acknowledged_on is not null and not exists(select 1 from preservations p where p.assignment_id=a.id and p.state='confirmed') order by h.code,c.name"],
 ['Which system owners have failed or pending preservation work?',"select owner,state,count(*)::int as records from v_preservation where state<>'confirmed' group by owner,state order by owner,state"],
 ['Which matters have the largest acknowledgement backlog?',"select m.code,count(*)::int as waiting from assignments a join holds h on h.id=a.hold_id join matters m on m.id=h.matter_id where h.status<>'released' and a.acknowledged_on is null group by m.code order by waiting desc,m.code"],
 ['Which imported holds still await activation review?',"select code,name,source_id from holds where source_id is not null and status='draft' order by code"]
];
export function required(o,k){const v=String(o[k]??'').trim();if(!v)throw Error(`Missing --${k}`);return v;}
export function day(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Use a real date YYYY-MM-DD');return v;}
const today=()=>new Date().toISOString().slice(0,10);
function past(v){day(v);if(v>today())throw Error('Recorded event cannot be in the future');return v;}
export async function match(db,table,value){
 const fields={matters:['code','name'],holds:['code','name'],custodians:['email','name']}[table];if(!fields)throw Error('Unknown entity');
 const rows=await db.query(`select * from ${table} order by id`);const q=String(value).toLowerCase();
 let found=rows.filter(r=>[r.id,...fields.map(f=>r[f])].some(x=>String(x).toLowerCase()===q));
 if(!found.length)found=rows.filter(r=>String(r.id).startsWith(q)||fields.some(f=>String(r[f]).toLowerCase().includes(q)));
 if(found.length!==1)throw Error(`${found.length?'Ambiguous':'No'} ${table} match: ${value}\n`+(found.length?found:rows).map(r=>`${r.id} | ${fields.map(f=>r[f]).join(' | ')}`).join('\n'));
 return found[0];
}
export async function run(db,cmd,args=[],o={}){
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='insights'){const out=[];for(const [question,sql]of questions)out.push({question,rows:await db.query(sql)});return out;}
 if(cmd==='attention')return {chase:await db.query(reads.chase),preservation:await db.query("select * from v_preservation where attention<>'recorded confirmation' order by hold,custodian"),reviews:await db.query(reads.reviews),departures:await db.query(reads.departures)};
 if(cmd==='hold'){const h=await match(db,'holds',args[0]||required(o,'hold'));return {hold:h,custodians:await db.query('select a.*,c.name,c.email from assignments a join custodians c on c.id=a.custodian_id where hold_id=$1 order by c.name',[h.id]),notes:await db.query('select * from notes where hold_id=$1 order by created_at',[h.id])};}
 if(cmd==='export'){const data={format:'legal-holds-v1',exported_at:new Date().toISOString()};for(const t of ['matters','holds','custodians','assignments','preservations','notes','audit_log'])data[t]=await db.query(`select * from ${t} order by id`);return data;}
 const actor=required(o,'actor');
 await db.exec('BEGIN');
 try{
 let result,id;
 const insert=async(sql,p)=> (await db.query(sql+' returning *',p))[0];
 if(cmd==='add-matter')result=await insert('insert into matters(code,name,counsel,jurisdiction,contemplated_on) values($1,$2,$3,$4,$5)',[required(o,'code'),required(o,'name'),required(o,'counsel'),required(o,'jurisdiction'),past(required(o,'date'))]);
 else if(cmd==='add-hold'){const m=await match(db,'matters',required(o,'matter'));result=await insert('insert into holds(matter_id,code,name,scope,review_due) values($1,$2,$3,$4,$5)',[m.id,required(o,'code'),required(o,'name'),required(o,'scope'),day(required(o,'due'))]);}
 else if(cmd==='add-custodian')result=await insert('insert into custodians(email,name,department,leaving_on) values($1,$2,$3,$4)',[required(o,'email').toLowerCase(),required(o,'name'),required(o,'department'),o.leaving?day(o.leaving):null]);
 else if(cmd==='import'){
 if(args[0]!=='exterro')throw Error('Use import exterro <CSV> --map=<mapping.json>');
 // Export columns vary. Require an explicit field map, never guess a native format.
 const mapping=JSON.parse(fs.readFileSync(required(o,'map'),'utf8'));
 const rows=parseCsv(fs.readFileSync(args[1],'utf8'));if(!rows.length)throw Error('CSV has no records');
 const keys=['source_id','matter_code','matter_name','counsel','jurisdiction','contemplated_on','hold_code','hold_name','scope','review_due'];
 for(const k of keys)if(!mapping[k]||!Object.hasOwn(rows[0],mapping[k]))throw Error(`Missing mapped CSV column for ${k}`);
 let imported=0,unchanged=0;
 for(const row of rows){const d=Object.fromEntries(keys.map(k=>[k,String(row[mapping[k]]??'').trim()]));for(const k of keys)if(!d[k])throw Error(`Empty ${k}`);past(d.contemplated_on);day(d.review_due);if(!['NZ','AU','other'].includes(d.jurisdiction))throw Error('Unknown jurisdiction');
 const old=(await db.query('select * from holds where source_id=$1',[d.source_id]))[0];
 if(old){if(JSON.stringify(old.source_data)!==JSON.stringify(row)){
 // jsonb reorders keys, compare canonical key order.
 const canonical=x=>JSON.stringify(Object.entries(x).sort(([a],[b])=>a.localeCompare(b)));
 if(canonical(old.source_data)!==canonical(row))throw Error(`Changed source ${d.source_id}: reconcile before re-import`);
 }unchanged++;continue;}
 let m=(await db.query('select * from matters where code=$1',[d.matter_code]))[0];
 if(m && (m.name!==d.matter_name||m.counsel!==d.counsel||m.jurisdiction!==d.jurisdiction||String(m.contemplated_on).slice(0,10)!==d.contemplated_on))throw Error(`Matter conflict ${d.matter_code}`);
 if(!m)m=await insert('insert into matters(code,name,counsel,jurisdiction,contemplated_on) values($1,$2,$3,$4,$5)',[d.matter_code,d.matter_name,d.counsel,d.jurisdiction,d.contemplated_on]);
 const h=await insert('insert into holds(matter_id,code,name,scope,review_due,source_id,source_data) values($1,$2,$3,$4,$5,$6,$7)',[m.id,d.hold_code,d.hold_name,d.scope,d.review_due,d.source_id,JSON.stringify(row)]);
 await db.query('insert into audit_log(action,entity_id,actor,detail) values($1,$2,$3,$4)',['import',h.id,actor,JSON.stringify({source_id:d.source_id})]);imported++;
 }result={imported,unchanged,status:'draft',notice:'No notice, acknowledgement or live preservation imported'};
 }else{
 const h=await match(db,'holds',required(o,'hold'));id=h.id;
 if(h.status==='released')throw Error('Released hold is read-only');
 if(cmd==='assign'){const c=await match(db,'custodians',required(o,'custodian'));result=await insert('insert into assignments(hold_id,custodian_id,response_due) values($1,$2,$3)',[h.id,c.id,day(required(o,'due'))]);}
 else if(['record-notice','acknowledge','preserve'].includes(cmd)){
 const c=await match(db,'custodians',required(o,'custodian'));const a=(await db.query('select * from assignments where hold_id=$1 and custodian_id=$2 for update',[h.id,c.id]))[0];if(!a)throw Error('Assign the custodian first');
 if(cmd==='record-notice'){if(a.notice_on)throw Error('Notice already recorded; retain evidence in log');result=await insert('update assignments set notice_on=$1,notice_ref=$2 where id=$3',[past(required(o,'date')),required(o,'evidence'),a.id]);}
 else if(cmd==='acknowledge'){if(!a.notice_on)throw Error('Record external notice evidence first');if(a.acknowledged_on)throw Error('Acknowledgement already recorded');const date=past(required(o,'date'));if(date<String(a.notice_on).slice(0,10))throw Error('Acknowledgement predates notice');result=await insert('update assignments set acknowledged_on=$1,acknowledgement_ref=$2 where id=$3',[date,required(o,'evidence'),a.id]);}
 else {const state=required(o,'state');if(!['pending','confirmed','failed'].includes(state))throw Error('State must be pending, confirmed or failed');result=await insert('insert into preservations(assignment_id,system_name,owner,state,evidence_ref,checked_on) values($1,$2,$3,$4,$5,$6) on conflict(assignment_id,system_name) do update set owner=excluded.owner,state=excluded.state,evidence_ref=excluded.evidence_ref,checked_on=excluded.checked_on',[a.id,required(o,'system'),required(o,'owner'),state,state==='confirmed'?required(o,'evidence'):o.evidence||null,past(required(o,'date'))]);}
 }else if(cmd==='activate'){
 const missing=await db.query("select finding from v_compliance where hold=$1 and rule in ('LH-01','LH-02','LH-03')",[h.code]);if(missing.length)throw Error('Activation blocked: '+missing.map(x=>x.finding).join('; '));
 result=await insert("update holds set status='active' where id=$1",[h.id]);
 }else if(cmd==='review')result=await insert('update holds set reviewed_on=$1,review_due=$2,review_evidence=$3 where id=$4',[past(required(o,'date')),day(required(o,'due')),required(o,'evidence'),h.id]);
 else if(cmd==='release'){
 const authority=required(o,'authority'), evidence=required(o,'evidence');
 const remaining=await db.query("select distinct c.name,h2.code as remaining_hold from assignments a join custodians c on c.id=a.custodian_id join assignments a2 on a2.custodian_id=c.id join holds h2 on h2.id=a2.hold_id where a.hold_id=$1 and h2.id<>$1 and h2.status<>'released' order by c.name,h2.code",[h.id]);
 result={hold:await insert("update holds set status='released',released_on=$1,release_authority=$2,release_evidence=$3 where id=$4",[past(required(o,'date')),authority,evidence,h.id]),remaining_holds:remaining,message:'Local register only. No data deleted and no source-system preservation removed.'};
 }else if(cmd==='log')result=await insert('insert into notes(hold_id,body,actor) values($1,$2,$3)',[h.id,required(o,'body'),actor]);
 else throw Error(`Unknown command: ${cmd}`);
 }
 if(cmd!=='import')await db.query('insert into audit_log(action,entity_id,actor,detail) values($1,$2,$3,$4)',[cmd,id||result.id,actor,JSON.stringify(result)]);
 if(o['dry-run'])await db.exec('ROLLBACK');else await db.exec('COMMIT');return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
