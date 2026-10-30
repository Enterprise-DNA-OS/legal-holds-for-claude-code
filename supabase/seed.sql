insert into matters(id,code,name,counsel,jurisdiction,contemplated_on) values
('10000000-0000-0000-0000-000000000001','M-101','Harbour supplier dispute','Alex Morgan','NZ',current_date-45),
('10000000-0000-0000-0000-000000000002','M-102','Southern distribution dispute','Robin Lee','AU',current_date-20) on conflict do nothing;
insert into holds(id,matter_id,code,name,scope,status,review_due) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','H-101','Harbour correspondence','Supplier correspondence, contract revisions and delivery records','active',current_date-3),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','H-102','Southern delivery history','Distribution emails and warehouse delivery records','active',current_date+14),
('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','H-103','Harbour pricing records','Price approvals and amendments','draft',current_date+7) on conflict do nothing;
insert into custodians(id,email,name,department,leaving_on) values
('30000000-0000-0000-0000-000000000001','maya@example.test','Maya Chen','Operations',current_date+5),
('30000000-0000-0000-0000-000000000002','noah@example.test','Noah Taylor','Sales',null),
('30000000-0000-0000-0000-000000000003','aria@example.test','Aria Williams','Finance',null) on conflict do nothing;
insert into assignments(id,hold_id,custodian_id,response_due,notice_on,notice_ref,acknowledged_on,acknowledgement_ref) values
('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',current_date-10,current_date-15,'demo-notice-101',null,null),
('40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002',current_date-10,current_date-15,'demo-notice-102',current_date-14,'demo-ack-102'),
('40000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001',current_date-2,null,null,null,null) on conflict do nothing;
insert into preservations(id,assignment_id,system_name,owner,state,evidence_ref,checked_on) values
('50000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','Mailbox','IT desk','pending',null,null),
('50000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002','Contract archive','Records desk','confirmed','demo-archive-check',current_date-35),
('50000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000003','Warehouse share','IT desk','failed','demo-access-error',current_date-1) on conflict do nothing;
