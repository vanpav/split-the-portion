-- Invites to a group by code or link (docs/SPEC.md §13.3). A code works for 7 days, for anyone who has it,
-- until it is revoked; one active code per group is reused.

create table "group_invite" ("code" text not null primary key, "group_id" text not null references "organization" ("id") on delete cascade, "created_by" text not null references "user" ("id") on delete cascade, "created_at" text not null, "expires_at" text not null, "revoked" integer not null default 0);

create index "group_invite_group_idx" on "group_invite" ("group_id");
