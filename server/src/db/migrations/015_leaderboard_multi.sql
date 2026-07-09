alter table leaderboard_entries add column if not exists label text not null default '';

alter table leaderboard_entries drop constraint if exists leaderboard_entries_user_id_key;

create unique index if not exists uq_leaderboard_user_label
  on leaderboard_entries(user_id, label);
