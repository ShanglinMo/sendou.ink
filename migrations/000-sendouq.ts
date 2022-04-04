import postgres from "postgres";

export async function up(sql: postgres.Sql<any>) {
  await sql`
    create table users (
      id serial primary key,
      discord_id text not null,
      discord_name text not null,
      discord_discriminator text not null,
      discord_avatar text,
      discord_refresh_token text not null,
      twitch text,
      twitter text,
      youtube_id text,
      youtube_name text,
      mini_bio text,
      friend_code text,
      can_vc boolean not null default false,
      weapon_pool text[],
      banned_until timestamp with time zone,
      created_at timestamp with time zone not null default current_timestamp
    )
  `;

  await sql`
  create table group_matches (
    id serial primary key,
    created_at timestamp with time zone not null default current_timestamp
  )
  `;

  await sql`CREATE TYPE group_type AS ENUM ('TWIN', 'QUAD', 'VERSUS')`;
  await sql`CREATE TYPE group_status AS ENUM ('PRE_ADD', 'LOOKING', 'MATCH', 'INACTIVE')`;
  await sql`
    create table groups (
      id serial primary key,
      ranked boolean,
      group_type group_type not null,
      group_status group_status not null,
      match_id integer references group_matches,
      invite_code uuid not null default gen_random_uuid(),
      created_at timestamp with time zone not null default current_timestamp,
      last_action_at timestamp with time zone not null default current_timestamp
    )
  `;
  // this is needed for `one_active_group_per_member` below
  await sql`create unique index groups_type_unique on groups (id, group_status)`;

  // TODO: index on type, status?

  await sql`
    create table group_members (
      group_id integer not null references groups on delete cascade,
      user_id integer not null references users,
      group_status group_status not null, 
      captain boolean not null default false,
      foreign key (group_id, group_status) references groups (id, group_status) on update cascade
    )
  `;
  await sql`create index fk_group_members_group_id on group_members (group_id)`;
  await sql`create index fk_group_members_user_id on group_members (user_id)`;

  await sql`
    create unique index one_active_group_per_member 
      on group_members (user_id)
      where group_status != 'INACTIVE';
  `;

  await sql`
    create table likes (
      liker_id integer not null references groups,
      target_id integer not null references groups
    )
  `;
  await sql`create index fk_likes_liker_id on likes (liker_id)`;
  await sql`create index fk_likes_target_id on likes (target_id)`;

  await sql`CREATE TYPE mode AS ENUM ('TW', 'SZ', 'TC', 'RM', 'CB')`;

  await sql` 
    create table stages (
      id serial primary key,
      name text not null,
      mode mode not null
    )
  `;

  await sql`
    create table group_match_stages (
      id serial primary key,
      match_id integer not null references group_matches on delete cascade,
      stage_id integer not null references stages,
      place integer not null,
      winner_group_id integer references groups,
      unique (match_id, place)
    );
  `;

  await sql`
    create table skills (
      mu numeric(100, 15) not null,
      sigma numeric(100, 15) not null,
      sp numeric generated always as (trunc((mu - 3 * sigma) * 10 + 1000, 2)) stored,
      user_id integer not null references users,
      match_id integer references group_matches,
      unique (user_id, match_id)
    )
  `;
}

export async function down(sql: postgres.Sql<any>) {
  await sql`drop table group_members`;
  await sql`drop table likes`;
  await sql`drop table skills`;
  await sql`drop table group_match_stages`;
  await sql`drop table groups`;
  await sql`drop table group_matches`;
  await sql`drop table users`;
  await sql`drop type group_type`;
  await sql`drop type group_status`;
  await sql`drop table stages`;
  await sql`drop type mode`;
}
