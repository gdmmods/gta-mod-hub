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