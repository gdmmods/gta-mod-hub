export type DiscoveredProject = {
  platform: string;
  externalId: string;
  title: string;
  projectUrl: string;

  // Existing preview image
  imageUrl?: string | null;

  // Additional discovery metadata
  description?: string | null;
  author?: string | null;
  category?: string | null;
  screenshots?: string[];
};

export type PlatformConnector = {
  discover: (
    profileUrl: string
  ) => Promise<DiscoveredProject[]>;

  verification?: {
    instructions?: (
      profileUrl: string
    ) => Promise<string>;

    start: (
      profileUrl: string
    ) => Promise<any>;

    check: (
      profileUrl: string,
      verificationCode: string
    ) => Promise<boolean>;
  };
};