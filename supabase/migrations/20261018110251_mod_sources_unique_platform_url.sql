ALTER TABLE public.mod_sources
  DROP CONSTRAINT mod_sources_unique_link,
  ADD CONSTRAINT mod_sources_platform_url_unique
    UNIQUE (platform_id, canonical_url);
