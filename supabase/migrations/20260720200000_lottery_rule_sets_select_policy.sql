-- Allow authenticated/anon to read lottery rule sets (needed for CSV import resolution).

begin;

drop policy if exists "lottery_rule_sets_public_read" on core.lottery_rule_sets;
create policy "lottery_rule_sets_public_read"
on core.lottery_rule_sets
for select
to authenticated, anon
using (true);

commit;
