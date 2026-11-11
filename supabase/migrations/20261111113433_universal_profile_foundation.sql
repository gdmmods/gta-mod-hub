-- Personal public fields are independent of creator and team profiles.
alter table public.profiles
  add column banner_url text check (char_length(banner_url)<=2048),
  add column tagline text check (char_length(tagline)<=200),
  add column location text check (char_length(location)<=120),
  add column interests text[] not null default '{}' check (cardinality(interests)<=20),
  add column socials jsonb not null default '{}' check (
    jsonb_typeof(socials)='object' and octet_length(socials::text)<=16384
    and socials - array['website','discord','youtube','instagram','twitter','github'] = '{}'::jsonb
  );

-- Use a dedicated bucket because the legacy creator-assets policies grant broad writes.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('profile-images','profile-images',true,5242880,array['image/jpeg','image/png','image/webp','image/gif']);

create policy "Upload own profile images" on storage.objects
for insert to authenticated with check (
  bucket_id='profile-images' and (storage.foldername(name))[1]=(select auth.uid())::text
  and name ~ '^[0-9a-f-]+/[0-9a-f-]+\.(jpg|png|webp|gif)$'
);

create function public.personal_relationship_counts(p_username text)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'following', (select count(*) from private.follows f where f.follower_user_id=p.id and f.creator_id is not null),
    'followedCreations', (select count(*) from private.follows f join public.mods m on m.id=f.mod_id
      where f.follower_user_id=p.id and private.follow_public_mod(m))
  )
  from public.profiles p
  where p.username=lower(p_username)
$$;
revoke all on function public.personal_relationship_counts(text) from public,anon,authenticated;
grant execute on function public.personal_relationship_counts(text) to anon,authenticated;
notify pgrst, 'reload schema';
