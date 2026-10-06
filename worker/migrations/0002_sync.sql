-- Sync (docs/ARCHITECTURE.md §10): the current state of every record of a group, and the group's clock.
-- A record removed on a device stays as a tombstone: `data` is null.

create table "group_clock" ("group_id" text not null primary key references "organization" ("id") on delete cascade, "seq" integer not null);

create table "record" ("group_id" text not null references "organization" ("id") on delete cascade, "type" text not null, "id" text not null, "data" text, "v" integer not null, "seq" integer not null, "updated_by" text not null, "updated_at" text not null, primary key ("group_id", "type", "id"));

create index "record_group_seq_idx" on "record" ("group_id", "seq");
