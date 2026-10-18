drop policy if exists "Allow creator inserts" on public.creators;
drop policy if exists "Allow update for all" on public.creators;

create policy "Users can insert own creators"
on public.creators
for insert
to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists "Creators can insert mods for approved creators" on public.mods;
create policy "Creators can insert mods they own"
on public.mods
for insert
to authenticated
with check (
  exists (
    select 1
    from public.creators c
    where c.id = mods.creator_id
      and c.owner_id = (select auth.uid())
  )
);

drop policy if exists "Creators can update own mods" on public.mods;
create policy "Creators can update mods they own"
on public.mods
for update
to authenticated
using (
  exists (
    select 1
    from public.creators c
    where c.id = mods.creator_id
      and c.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.creators c
    where c.id = mods.creator_id
      and c.owner_id = (select auth.uid())
  )
);

drop policy if exists "Creators can link mods for approved creators" on public.mod_creators;
create policy "Creators can link their own mods"
on public.mod_creators
for insert
to authenticated
with check (
  role = 'owner'
  and exists (
    select 1
    from public.mods m
    join public.creators c on c.id = m.creator_id
    where m.id = mod_creators.mod_id
      and mod_creators.creator_id = c.id
      and c.owner_id = (select auth.uid())
  )
);

drop policy if exists "Creators can add games to their mods" on public.mod_games;
create policy "Creators can add games to owned mods"
on public.mod_games
for insert
to authenticated
with check (
  exists (
    select 1
    from public.mods m
    join public.creators c on c.id = m.creator_id
    where m.id = mod_games.mod_id
      and c.owner_id = (select auth.uid())
  )
);;
