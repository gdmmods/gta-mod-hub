DROP POLICY mod_sources_public_read_visible_mods ON public.mod_sources;
DROP POLICY mod_sources_owner_read ON public.mod_sources;

CREATE POLICY mod_sources_read_public_or_owner
  ON public.mod_sources
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.mods AS m
      WHERE m.id = mod_sources.mod_id
        AND m.status = 'published'
        AND m.visibility IN ('public', 'early_access')
    )
    OR (
      (SELECT auth.uid()) IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.mods AS m
        JOIN public.creators AS c ON c.id = m.creator_id
        WHERE m.id = mod_sources.mod_id
          AND c.owner_id = (SELECT auth.uid())
      )
    )
  );

DROP INDEX public.mod_sources_platform_id_idx;
CREATE INDEX mod_sources_mod_id_idx ON public.mod_sources(mod_id);
