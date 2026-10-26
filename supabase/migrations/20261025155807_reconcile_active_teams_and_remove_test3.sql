-- Reconcile the three intended teams, then remove the explicitly approved
-- Test3 team. Every mutation is guarded by the previously verified IDs and
-- relationships; the migration aborts if the live records have drifted.
do $$
declare
  affected integer;
  asyr0n_mods_before bigint;
  asyr0n_links_before bigint;
begin
  -- Confirm the owner identities remain verified before relinking teams.
  if not exists (
    select 1 from public.creators c
    join public.creator_members cm on cm.creator_id = c.id
    where c.id = 'f435fe59-0d9b-4c55-8fee-ce71b0fa7b65'
      and c.name = 'Asyr0n' and c.owner_type = 'user'
      and cm.profile_id = c.owner_id and cm.role = 'owner' and cm.status = 'approved'
  ) then
    raise exception 'Verified Asyr0n creator ownership changed; aborting team reconciliation';
  end if;
  if not exists (
    select 1 from public.creators c
    join public.creator_members cm on cm.creator_id = c.id
    where c.id = 'e9ce6108-30da-4789-9d26-2711627483f0'
      and c.name = 'P3AK' and c.owner_type = 'user'
      and cm.profile_id = c.owner_id and cm.role = 'owner' and cm.status = 'approved'
  ) then
    raise exception 'Verified P3AK creator ownership changed; aborting team reconciliation';
  end if;

  -- DT Designs is already correct; fail rather than silently changing it.
  if not exists (
    select 1 from public.teams t
    join public.creators team_profile on team_profile.id = t.creator_id
    where t.id = '1689ce34-be78-411c-b056-92b06f624651'
      and t.name = 'DT Designs [DTD]' and t.status = 'active'
      and t.owner_id = 'f435fe59-0d9b-4c55-8fee-ce71b0fa7b65'
      and team_profile.id = '43fdd0e9-a8c8-4e12-a64d-b84a3ac70338'
      and team_profile.owner_type = 'team' and team_profile.team_id = t.id
  ) then
    raise exception 'DT Designs ownership or team-profile link changed; aborting';
  end if;

  -- ModVault Team: move ownership from its team profile to Asyr0n and link
  -- that same team profile through teams.creator_id.
  if not exists (
    select 1 from public.teams t
    join public.creators team_profile on team_profile.id = '09c9603e-593f-42d0-a321-9ab1a76b15d3'
      and team_profile.owner_type = 'team' and team_profile.team_id = t.id
    join public.team_members tm on tm.id = '7e643601-c888-4f98-9742-b5b2fe52513f'
      and tm.team_id = t.id and tm.creator_id = 'f435fe59-0d9b-4c55-8fee-ce71b0fa7b65'
      and tm.role = 'owner' and tm.left_at is null and coalesce(tm.membership_status, 'active') = 'active'
    where t.id = '488fe510-99f1-4b0f-b792-63d6ab534ea2'
      and t.name = 'ModVault Team' and t.status = 'active'
      and t.owner_id = team_profile.id and t.creator_id is null
  ) then
    raise exception 'ModVault Team records changed; aborting owner/profile correction';
  end if;
  update public.teams
  set owner_id = 'f435fe59-0d9b-4c55-8fee-ce71b0fa7b65',
      creator_id = '09c9603e-593f-42d0-a321-9ab1a76b15d3',
      updated_at = now()
  where id = '488fe510-99f1-4b0f-b792-63d6ab534ea2'
    and owner_id = '09c9603e-593f-42d0-a321-9ab1a76b15d3' and creator_id is null;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'ModVault Team correction did not update exactly one row'; end if;

  -- P3AK´D: move ownership to P3AK and link its reciprocal team profile.
  if not exists (
    select 1 from public.teams t
    join public.creators team_profile on team_profile.id = '3f7a1ef7-5cd8-49aa-bd51-c90e94731159'
      and team_profile.owner_type = 'team' and team_profile.team_id = t.id
    join public.team_members tm on tm.id = '5b023015-f3f8-4f9a-8a99-c1fd3de6b096'
      and tm.team_id = t.id and tm.creator_id = 'e9ce6108-30da-4789-9d26-2711627483f0'
      and tm.role = 'owner' and tm.left_at is null and coalesce(tm.membership_status, 'active') = 'active'
    where t.id = '21fefb18-d3d6-42dc-84d5-bf5917369dab'
      and t.name = 'P3AK´D' and t.status = 'active'
      and t.owner_id = team_profile.id and t.creator_id is null
  ) then
    raise exception 'P3AK´D records changed; aborting owner/profile correction';
  end if;
  update public.teams
  set owner_id = 'e9ce6108-30da-4789-9d26-2711627483f0',
      creator_id = '3f7a1ef7-5cd8-49aa-bd51-c90e94731159',
      updated_at = now()
  where id = '21fefb18-d3d6-42dc-84d5-bf5917369dab'
    and owner_id = '3f7a1ef7-5cd8-49aa-bd51-c90e94731159' and creator_id is null;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'P3AK´D correction did not update exactly one row'; end if;

  -- Preserve Asyr0n's creator and mod relationships across the Test3 deletion.
  select count(*) into asyr0n_mods_before from public.mods
    where creator_id = 'f435fe59-0d9b-4c55-8fee-ce71b0fa7b65';
  select count(*) into asyr0n_links_before from public.mod_creators
    where creator_id = 'f435fe59-0d9b-4c55-8fee-ce71b0fa7b65';

  -- Test3 has exactly one verified team_members child (which cascades), and no
  -- invitations, profile, role-history, activity, creator, or mod dependents.
  if not exists (
    select 1 from public.teams t
    where t.id = '2474c901-b30a-4587-aacb-9cae700b16c6'
      and t.name = 'Modvault Test3' and t.status = 'active'
      and t.owner_id = 'f435fe59-0d9b-4c55-8fee-ce71b0fa7b65'
      and t.creator_id is null
  ) then raise exception 'Modvault Test3 team row changed; aborting deletion'; end if;
  if (select count(*) from public.team_members where team_id = '2474c901-b30a-4587-aacb-9cae700b16c6') <> 1
    or not exists (select 1 from public.team_members where id = 'b4b8ee5c-5848-4a0d-acdf-9d99eca4e207'
      and team_id = '2474c901-b30a-4587-aacb-9cae700b16c6'
      and creator_id = 'f435fe59-0d9b-4c55-8fee-ce71b0fa7b65' and role = 'owner'
      and left_at is null and coalesce(membership_status, 'active') = 'active') then
    raise exception 'Test3 membership dependencies changed; aborting deletion';
  end if;
  if exists (select 1 from public.invitations where team_id = '2474c901-b30a-4587-aacb-9cae700b16c6')
    or exists (select 1 from public.creators where team_id = '2474c901-b30a-4587-aacb-9cae700b16c6')
    or exists (select 1 from public.team_role_history where team_member_id = 'b4b8ee5c-5848-4a0d-acdf-9d99eca4e207')
    or exists (select 1 from public.activity_events where target_id = '2474c901-b30a-4587-aacb-9cae700b16c6'
      or parent_id = '2474c901-b30a-4587-aacb-9cae700b16c6')
    or exists (select 1 from public.creators where '2474c901-b30a-4587-aacb-9cae700b16c6'::uuid = any(coalesce(previous_team_ids, '{}'::uuid[]))) then
    raise exception 'Test3 has new dependent records; aborting deletion';
  end if;

  delete from public.teams where id = '2474c901-b30a-4587-aacb-9cae700b16c6';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Test3 deletion did not remove exactly one team row'; end if;
  if not exists (select 1 from public.creators where id = 'f435fe59-0d9b-4c55-8fee-ce71b0fa7b65')
    or (select count(*) from public.mods where creator_id = 'f435fe59-0d9b-4c55-8fee-ce71b0fa7b65') <> asyr0n_mods_before
    or (select count(*) from public.mod_creators where creator_id = 'f435fe59-0d9b-4c55-8fee-ce71b0fa7b65') <> asyr0n_links_before then
    raise exception 'Asyr0n creator/mod data changed unexpectedly';
  end if;
end;
$$;
