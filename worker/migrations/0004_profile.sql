-- Profiles (docs/SPEC.md §13.2): first and last name, the nickname others see, and the avatar.
-- Every field may be empty. The avatar is a 256×256 image cut on the phone, kept here in D1;
-- `user.image` is its address with a version, `/api/avatars/<userId>?v=<time>`.

alter table "user" add column "firstName" text;

alter table "user" add column "lastName" text;

alter table "user" add column "nickname" text;

create table "avatar" ("user_id" text not null primary key references "user" ("id") on delete cascade, "bytes" blob not null, "type" text not null, "updated_at" text not null);
