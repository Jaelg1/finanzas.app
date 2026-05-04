-- Ejecutar en Supabase: SQL Editor → New query → Run

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null default (current_date at time zone 'utc'),
  tipo text not null check (tipo in ('Ingreso', 'Gasto')),
  grupo text not null,
  categoria text not null,
  concepto text not null default '',
  monto numeric(14, 2) not null check (monto >= 0),
  cuota_actual smallint null,
  cuota_total smallint null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_fecha_idx
  on public.transactions (user_id, fecha desc);

alter table public.transactions enable row level security;

drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "transactions_insert_own" on public.transactions;
drop policy if exists "transactions_update_own" on public.transactions;
drop policy if exists "transactions_delete_own" on public.transactions;

create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "transactions_insert_own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "transactions_update_own"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions_delete_own"
  on public.transactions for delete
  using (auth.uid() = user_id);
