ALTER TABLE public.mods
  ADD COLUMN creator_backup_url text,
  ADD CONSTRAINT mods_creator_backup_url_https_check
    CHECK (
      creator_backup_url IS NULL OR (
        length(creator_backup_url) <= 2048
        AND creator_backup_url ~ '^https://[^[:space:]]+$'
      )
    );

CREATE TABLE public.mod_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mod_id uuid NOT NULL REFERENCES public.mods(id) ON DELETE CASCADE,
  platform_id uuid NOT NULL REFERENCES public.platforms(id) ON DELETE RESTRICT,
  canonical_url text NOT NULL
    CHECK (
      length(canonical_url) <= 2048
      AND canonical_url ~ '^https://[^[:space:]]+$'
    ),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mod_sources_unique_link UNIQUE (mod_id, platform_id, canonical_url)
);

CREATE INDEX mod_sources_platform_id_idx ON public.mod_sources(platform_id);

ALTER TABLE public.mod_sources ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mod_sources FROM anon, authenticated;
GRANT SELECT ON public.mod_sources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mod_sources TO authenticated;

CREATE POLICY mod_sources_public_read_visible_mods
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
  );

CREATE POLICY mod_sources_owner_read
  ON public.mod_sources
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.mods AS m
      JOIN public.creators AS c ON c.id = m.creator_id
      WHERE m.id = mod_sources.mod_id
        AND c.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY mod_sources_owner_insert
  ON public.mod_sources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.mods AS m
      JOIN public.creators AS c ON c.id = m.creator_id
      WHERE m.id = mod_sources.mod_id
        AND c.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY mod_sources_owner_update
  ON public.mod_sources
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.mods AS m
      JOIN public.creators AS c ON c.id = m.creator_id
      WHERE m.id = mod_sources.mod_id
        AND c.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.mods AS m
      JOIN public.creators AS c ON c.id = m.creator_id
      WHERE m.id = mod_sources.mod_id
        AND c.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY mod_sources_owner_delete
  ON public.mod_sources
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.mods AS m
      JOIN public.creators AS c ON c.id = m.creator_id
      WHERE m.id = mod_sources.mod_id
        AND c.owner_id = (SELECT auth.uid())
    )
  );
