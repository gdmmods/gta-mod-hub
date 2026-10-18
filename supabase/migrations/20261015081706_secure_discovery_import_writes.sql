drop policy if exists "Allow mods inserts" on public.mods;
drop policy if exists "allow insert" on public.mods;
drop policy if exists "Allow mods updates" on public.mods;
drop policy if exists "Allow mod_creators inserts" on public.mod_creators;
drop policy if exists "Allow mod_creators updates" on public.mod_creators;

create policy "Creators can insert mods for approved creators"
on public.mods
for insert
to authenticated
with check (
  exists (
    select 1
    from public.creator_members cm
    where cm.creator_id = mods.creator_id
      and cm.profile_id = (select auth.uid())
      and cm.status = 'approved'
  )
);

create policy "Creators can link mods for approved creators"
on public.mod_creators
for insert
to authenticated
with check (
  exists (
    select 1
    from public.creator_members cm
    join public.mods m on m.creator_id = cm.creator_id
    where m.id = mod_creators.mod_id
      and mod_creators.creator_id = cm.creator_id
      and cm.profile_id = (select auth.uid())
      and cm.status = 'approved'
  )
);;
