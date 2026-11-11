-- Public aggregates for the viewed creator identity. Counts use the existing
-- target and follower indexes, and followed mods use the directory's visibility rule.
create function public.creator_relationship_counts(p_creator uuid)
returns jsonb
language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'followers', (select count(*) from private.follows f where f.creator_id=c.id),
    'following', outgoing.creators,
    'followedCreations', outgoing.mods
  )
  from public.creators c
  cross join lateral (
    select count(*) filter (where f.creator_id is not null) creators,
      count(*) filter (where m.id is not null) mods
    from private.follows f
    left join public.mods m on m.id=f.mod_id and private.follow_public_mod(m)
    where f.follower_creator_id=c.id
  ) outgoing
  where c.id=p_creator
$$;

revoke all on function public.creator_relationship_counts(uuid) from public,anon,authenticated;
grant execute on function public.creator_relationship_counts(uuid) to anon,authenticated;
notify pgrst, 'reload schema';
