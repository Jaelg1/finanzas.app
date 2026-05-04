-- Si ya tenías la tabla sin cuotas, ejecutá esto una vez en SQL Editor:

alter table public.transactions
  add column if not exists cuota_actual smallint null;

alter table public.transactions
  add column if not exists cuota_total smallint null;
