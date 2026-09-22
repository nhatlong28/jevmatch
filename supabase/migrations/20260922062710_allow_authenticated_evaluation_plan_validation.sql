-- The lifecycle trigger runs with the authenticated caller's privileges and
-- delegates its pure JSON validation to this function. Keep anonymous callers
-- denied while allowing authenticated Job writes to execute the trigger.
grant execute on function public.evaluation_plan_is_valid(jsonb) to authenticated;
