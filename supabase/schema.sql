-- Run this in your Supabase project: SQL Editor > New Query > paste > Run

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  audio_url text,
  duration_seconds float,
  feedback jsonb,
  title text,
  notes text
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  description text not null,
  target_date date,
  completed boolean default false
);

-- Row Level Security: users can only access their own data
alter table sessions enable row level security;
alter table goals enable row level security;

create policy "Users can manage their own sessions"
  on sessions for all
  using (auth.uid() = user_id);

create policy "Users can manage their own goals"
  on goals for all
  using (auth.uid() = user_id);

-- Storage bucket for audio clips (run this too)
-- Go to Storage > New bucket > name: audio-clips > Public: true
