-- Extend Lotto 6aus49 rule-set validity so historical imports (from 2018) validate.

begin;

update core.lottery_rule_sets
set valid_from = date '2018-01-01'
where id = '22222222-2222-4222-8222-222222222222'::uuid
  and valid_from > date '2018-01-01';

commit;
