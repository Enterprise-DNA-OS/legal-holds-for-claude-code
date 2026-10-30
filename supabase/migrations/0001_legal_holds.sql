create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table matters(id uuid primary key default gen_random_uuid(), code text not null unique check(btrim(code)<>''), name text not null check(btrim(name)<>''), counsel text not null check(btrim(counsel)<>''), jurisdiction text not null check(jurisdiction in ('NZ','AU','other')), contemplated_on date not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table holds(id uuid primary key default gen_random_uuid(), matter_id uuid not null references matters(id), code text not null unique check(btrim(code)<>''), name text not null check(btrim(name)<>''), scope text not null check(btrim(scope)<>''), status text not null default 'draft' check(status in ('draft','active','released')), review_due date not null, reviewed_on date, review_evidence text, released_on date, release_authority text, release_evidence text, source_id text unique, source_data jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(status<>'released' or (released_on is not null and nullif(btrim(release_authority),'') is not null and nullif(btrim(release_evidence),'') is not null)));
create table custodians(id uuid primary key default gen_random_uuid(), email text not null unique check(email=lower(email) and email like '%@%'), name text not null check(btrim(name)<>''), department text not null, leaving_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table assignments(id uuid primary key default gen_random_uuid(), hold_id uuid not null references holds(id), custodian_id uuid not null references custodians(id), response_due date not null, notice_on date, notice_ref text, acknowledged_on date, acknowledgement_ref text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(hold_id,custodian_id), check((notice_on is null)=(notice_ref is null)), check((acknowledged_on is null)=(acknowledgement_ref is null)), check(acknowledged_on is null or (notice_on is not null and acknowledged_on>=notice_on)));
create table preservations(id uuid primary key default gen_random_uuid(), assignment_id uuid not null references assignments(id), system_name text not null check(btrim(system_name)<>''), owner text not null check(btrim(owner)<>''), state text not null default 'pending' check(state in ('pending','confirmed','failed')), evidence_ref text, checked_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(assignment_id,system_name), check(state<>'confirmed' or (nullif(btrim(evidence_ref),'') is not null and checked_on is not null)));
create table notes(id uuid primary key default gen_random_uuid(), hold_id uuid not null references holds(id), body text not null check(btrim(body)<>''), actor text not null check(btrim(actor)<>''), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table audit_log(id uuid primary key default gen_random_uuid(), action text not null, entity_id uuid not null, actor text not null check(btrim(actor)<>''), detail jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create function no_rewrite() returns trigger language plpgsql as $$ begin raise exception 'Append-only history'; end $$;
create trigger audit_immutable before update or delete on audit_log for each row execute function no_rewrite();
create trigger notes_immutable before update or delete on notes for each row execute function no_rewrite();
do $$ declare n text; begin
foreach n in array array['matters','holds','custodians','assignments','preservations'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated()',n);
end loop;
foreach n in array array['matters','holds','custodians','assignments','preservations','notes','audit_log'] loop
 execute format('alter table %I enable row level security',n); execute format('revoke all on %I from public',n);
end loop; end $$;
create index hold_matter_idx on holds(matter_id);
create index assignment_custodian_idx on assignments(custodian_id);
create index preservation_assignment_idx on preservations(assignment_id);
create view v_holds with (security_invoker=true) as
 select h.id,h.code,h.name,m.code as matter,m.counsel,m.jurisdiction,h.status,h.review_due,
 (select count(*)::int from assignments a where a.hold_id=h.id) as custodians,
 (select count(*)::int from assignments a where a.hold_id=h.id and a.acknowledged_on is null) as awaiting_response
 from holds h join matters m on m.id=h.matter_id;
create view v_chase with (security_invoker=true) as
 select a.id,h.code as hold,c.name as custodian,c.email,a.response_due,a.notice_on,a.acknowledged_on,
 case when a.notice_on is null then 'notice evidence missing' when a.response_due<current_date then 'overdue acknowledgement' else 'awaiting acknowledgement' end as reason
 from assignments a join holds h on h.id=a.hold_id join custodians c on c.id=a.custodian_id
 where h.status<>'released' and a.acknowledged_on is null;
create view v_preservation with (security_invoker=true) as
 select p.id,h.code as hold,c.name as custodian,p.system_name,p.owner,p.state,p.checked_on,p.evidence_ref,
 case when p.state<>'confirmed' then p.state when p.checked_on<current_date-30 then 'evidence review due' else 'recorded confirmation' end as attention
 from preservations p join assignments a on a.id=p.assignment_id join holds h on h.id=a.hold_id join custodians c on c.id=a.custodian_id where h.status<>'released';
create view v_departures with (security_invoker=true) as
 select c.id,c.name,c.email,c.leaving_on,h.code as hold,a.acknowledged_on,
 (select count(*)::int from preservations p where p.assignment_id=a.id and p.state='confirmed') as confirmations
 from custodians c join assignments a on a.custodian_id=c.id join holds h on h.id=a.hold_id
 where h.status<>'released' and c.leaving_on<=current_date+30;
create view v_compliance with (security_invoker=true) as
 select h.code as hold,'LH-01' as rule,'Hold has no recorded custodians' as finding from holds h where status<>'released' and not exists(select 1 from assignments a where a.hold_id=h.id)
 union all select h.code,'LH-02','Custodian has no notice evidence: '||c.name from assignments a join holds h on h.id=a.hold_id join custodians c on c.id=a.custodian_id where h.status<>'released' and a.notice_on is null
 union all select h.code,'LH-03','Custodian has no confirmed preservation: '||c.name from assignments a join holds h on h.id=a.hold_id join custodians c on c.id=a.custodian_id where h.status<>'released' and not exists(select 1 from preservations p where p.assignment_id=a.id and p.state='confirmed')
 union all select h.code,'LH-04','Hold review overdue' from holds h where status<>'released' and review_due<current_date
 union all select p.hold,'LH-05','Review preservation evidence: '||p.custodian||' / '||p.system_name from v_preservation p where attention<>'recorded confirmation';
