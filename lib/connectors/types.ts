export type DiscoveredProject = {
  platform: string;
  externalId: string;
  title: string;
  projectUrl: string;
  imageUrl?: string | null;
};

export type PlatformConnector = {
  discover: (
    profileUrl: string
  ) => Promise<DiscoveredProject[]>;
};