-- Public, optional collaboration details scoped to one publishing identity.
create table private.collaboration_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,
  creator_id uuid unique references public.creators(id) on delete cascade,
  skills text check (char_length(skills)<=200),
  interests text check (char_length(interests)<=200),
  looking_for text check (char_length(looking_for)<=300),
  availability text check (availability in ('open','selective','unavailable')),
  check (num_nonnulls(user_id,creator_id)=1)
);
alter table private.collaboration_profiles enable row level security;
revoke all on private.collaboration_profiles from public,anon,authenticated;

create function public.my_collaboration_profile(p_creator uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('skills',c.skills,'interests',c.interests,'looking_for',c.looking_for,'availability',c.availability)
  from private.collaboration_profiles c where
    (p_creator is null and c.user_id=auth.uid())
    or (c.creator_id=p_creator and private.announcement_owner(p_creator,auth.uid()))
$$;

create function public.save_collaboration_profile(p_creator uuid,p_skills text,p_interests text,p_looking_for text,p_availability text)
returns void language plpgsql security definer set search_path='' as $$
declare
  account uuid := auth.uid();
  skills_value text := nullif(btrim(p_skills),'');
  interests_value text := nullif(btrim(p_interests),'');
  looking_value text := nullif(btrim(p_looking_for),'');
begin
  if account is null or not exists(select 1 from public.profiles p where p.id=account) then
    raise exception 'Sign in to edit collaboration details.' using errcode='42501';
  end if;
  if p_creator is not null then
    perform private.require_operational_creator(p_creator);
    if not private.announcement_owner(p_creator,account) then
      raise exception 'Only the verified creator or team owner can edit collaboration details.' using errcode='42501';
    end if;
  end if;
  if char_length(skills_value)>200 or char_length(interests_value)>200 or char_length(looking_value)>300
    or p_availability not in ('open','selective','unavailable') then
    raise exception 'Check the length and availability of your collaboration details.' using errcode='22023';
  end if;
  if p_creator is null then
    insert into private.collaboration_profiles(user_id,skills,interests,looking_for,availability)
    values(account,skills_value,interests_value,looking_value,p_availability)
    on conflict(user_id) do update set skills=excluded.skills,interests=excluded.interests,
      looking_for=excluded.looking_for,availability=excluded.availability;
  else
    insert into private.collaboration_profiles(creator_id,skills,interests,looking_for,availability)
    values(p_creator,skills_value,interests_value,looking_value,p_availability)
    on conflict(creator_id) do update set skills=excluded.skills,interests=excluded.interests,
      looking_for=excluded.looking_for,availability=excluded.availability;
  end if;
end $$;

-- Simple dictionaries retain modding terms and names without language-specific stemming.
create index discovery_public_mod_titles on public.mods(lower(title),id)
  where status='published' and visibility in ('public','early_access') and release_state in ('public','early_access');
create index discovery_discussion_body on private.discussion_comments
  using gin(to_tsvector('simple'::regconfig,body)) where target_type='mod' and status='published';

create function public.creative_discovery_search(p_query text,p_category text,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  term text := lower(btrim(coalesce(p_query,'')));
  plain_handle text := ltrim(term,'@');
  words tsquery;
  result jsonb;
  page_size constant integer := 18;
begin
  if p_category is null or p_category not in ('all','people','creations','contributions')
    or char_length(term)>96 or p_offset is null or p_offset not between 0 and 900
    or (p_category='all' and p_offset<>0) then
    raise exception 'Invalid discovery search.' using errcode='22023';
  end if;
  words := plainto_tsquery('simple',term);

  if p_category='all' then
    return jsonb_build_object(
      'people',public.creative_discovery_search(term,'people',0)->'items',
      'creations',public.creative_discovery_search(term,'creations',0)->'items',
      'contributions',public.creative_discovery_search(term,'contributions',0)->'items'
    );
  end if;

  if p_category='people' then
    with people as (
      select i.id,i.kind,case when c.owner_type='team' then 'team' else i.kind end identity_type,
        i.name,i.avatar,i.handle,i.href,
        coalesce(i.specialization,p.interests,'{}') tags,
        coalesce(c.bio,p.bio,'') bio, cp.skills,cp.interests,cp.looking_for,cp.availability
      from private.follow_public_identities i
      left join public.profiles p on i.kind='user' and p.id=i.id
      left join public.creators c on i.kind='creator' and c.id=i.id
      left join private.collaboration_profiles cp on cp.user_id=p.id or cp.creator_id=c.id
      where nullif(btrim(i.name),'') is not null and (i.kind='user' or public.is_creator_operational(i.id))
    ), scored as (
      select people.*, case
        when term='' then 0
        when lower(handle)=plain_handle then 1
        when lower(name)=term then 2
        when starts_with(lower(name),term) then 3
        when strpos(lower(name),term)>0 then 4
        when strpos(lower(coalesce(handle,'')),plain_handle)>0 and plain_handle<>'' then 4
        when strpos(lower(concat_ws(' ',array_to_string(tags,' '),skills,interests)),term)>0 then 5
        when numnode(words)>0 and to_tsvector('simple',concat_ws(' ',bio,looking_for)) @@ words then 6
        end rank
      from people
    ), page as (
      select * from scored where rank is not null order by rank,lower(name),kind,id limit page_size+1 offset p_offset
    )
    select coalesce(jsonb_agg(to_jsonb(page)-'bio'-'rank' order by rank,lower(name),kind,id),'[]'::jsonb)
    into result from page;
  elsif p_category='creations' then
    with page as (
      select m.id,m.title,m.image,m.description,m.category,m.creator,m.likes,m.downloads,m.creator_id,
        case when lower(m.title)=term then 1 when starts_with(lower(m.title),term) then 2 else 3 end rank
      from public.mods m
      where m.status='published' and m.visibility in ('public','early_access')
        and m.release_state in ('public','early_access')
        and (term='' or strpos(lower(m.title),term)>0)
      order by rank,lower(m.title),m.id limit page_size+1 offset p_offset
    )
    select coalesce(jsonb_agg((to_jsonb(m)-'rank'-'creator_id') ||
      jsonb_build_object('mod_creators',attribution.creators) order by m.rank,lower(m.title),m.id),'[]'::jsonb)
    into result from page m cross join lateral (
      select coalesce(jsonb_agg(jsonb_build_object('creators',jsonb_build_object('id',c.id,'name',c.name))
        order by (c.id=m.creator_id) desc nulls last,c.id),'[]'::jsonb) creators
      from (select m.creator_id id union select mc.creator_id from public.mod_creators mc where mc.mod_id=m.id) linked
      join public.creators c on c.id=linked.id
    ) attribution;
  else
    if char_length(term)<3 or numnode(words)=0 then return jsonb_build_object('items','[]'::jsonb); end if;
    with page as (
      select c.id,c.target_id,m.title mod_title,
        left(regexp_replace(ts_headline('simple',c.body,words,
          'MaxFragments=1, MaxWords=22, MinWords=8'),'</?b>|[[:space:]]+',' ','g'),240) excerpt,
        coalesce(author.name, 'ModVault member') author_name,author.href author_href,
        awarded.name recognized_by,ts_rank(to_tsvector('simple',c.body),words) rank
      from private.discussion_comments c
      join public.mods m on m.id=c.target_id and private.follow_public_mod(m)
      left join private.follow_public_identities author on
        (author.kind='creator' and author.id=c.author_creator_id)
        or (author.kind='user' and c.author_creator_id is null and author.id=c.author_account_id)
      left join private.discussion_recognitions r on r.comment_id=c.id and r.revoked_at is null
      left join public.creators awarded on awarded.id=r.awarded_creator_id
      where c.target_type='mod' and c.status='published' and private.recognition_visible(c)
        and to_tsvector('simple',c.body) @@ words
      order by rank desc,c.id limit page_size+1 offset p_offset
    )
    select coalesce(jsonb_agg(to_jsonb(page)-'rank' order by rank desc,id),'[]'::jsonb)
    into result from page;
  end if;
  return jsonb_build_object('items',result);
end $$;

revoke all on function public.my_collaboration_profile(uuid),public.save_collaboration_profile(uuid,text,text,text,text),
  public.creative_discovery_search(text,text,integer) from public,anon,authenticated;
grant execute on function public.my_collaboration_profile(uuid),public.save_collaboration_profile(uuid,text,text,text,text) to authenticated;
grant execute on function public.creative_discovery_search(text,text,integer) to anon,authenticated;
notify pgrst, 'reload schema';
