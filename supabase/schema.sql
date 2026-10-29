create table if not exists public.sudoku_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_key text not null unique,
  room_code text unique,
  board jsonb not null,
  solution jsonb not null,
  created_at timestamptz not null default now(),
  constraint sudoku_challenges_room_code_format
    check (room_code is null or room_code ~ '^[A-Z0-9]{6}$'),
  constraint sudoku_challenges_puzzle_arrays
    check (jsonb_typeof(board) = 'array' and jsonb_typeof(solution) = 'array')
);

create table if not exists public.challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.sudoku_challenges(id) on delete cascade,
  username text not null check (
    char_length(username) between 2 and 20
    and username ~ '^[A-Za-z0-9][A-Za-z0-9 _.-]{1,19}$'
  ),
  elapsed_seconds integer not null check (elapsed_seconds >= 0),
  mistakes integer not null check (mistakes >= 0),
  completed_at timestamptz not null default now()
);

create unique index if not exists challenge_attempts_one_username_per_challenge
  on public.challenge_attempts (challenge_id, lower(username));
create index if not exists challenge_attempts_leaderboard_order
  on public.challenge_attempts (challenge_id, elapsed_seconds, mistakes);

alter table public.sudoku_challenges enable row level security;
alter table public.challenge_attempts enable row level security;

drop policy if exists "Anyone can read challenges" on public.sudoku_challenges;
create policy "Anyone can read challenges"
  on public.sudoku_challenges for select to anon, authenticated
  using (true);

drop policy if exists "Anyone can create challenges" on public.sudoku_challenges;
create policy "Anyone can create challenges"
  on public.sudoku_challenges for insert to anon, authenticated
  with check (
    (room_code is null and challenge_key ~ '^daily:[0-9]{4}-[0-9]{2}-[0-9]{2}$')
    or (room_code is not null and challenge_key = 'room:' || room_code)
  );

drop policy if exists "Anyone can read completed attempts" on public.challenge_attempts;
create policy "Anyone can read completed attempts"
  on public.challenge_attempts for select to anon, authenticated
  using (true);

drop policy if exists "Anyone can submit a completed attempt" on public.challenge_attempts;
create policy "Anyone can submit a completed attempt"
  on public.challenge_attempts for insert to anon, authenticated
  with check (true);

grant select, insert on public.sudoku_challenges to anon, authenticated;
grant select, insert on public.challenge_attempts to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'challenge_attempts'
  ) then
    alter publication supabase_realtime add table public.challenge_attempts;
  end if;
end
$$;
