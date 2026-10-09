import type {
  DiscoveredProject,
  PlatformConnector,
} from "./types";

const GTAINSIDE_HOSTS = [
  "gtainside.com",
  "www.gtainside.com",
];

function isValidProfileUrl(
  value: string
): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      GTAINSIDE_HOSTS.includes(
        url.hostname.toLowerCase()
      ) &&
      /^\/profile\/[^/]+\/?$/.test(
        url.pathname
      ) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

async function fetchProfile(
  profileUrl: string
): Promise<string> {
  if (!isValidProfileUrl(profileUrl)) {
    throw new Error(
      "Invalid GTAinside profile URL."
    );
  }

  const response = await fetch(
    profileUrl,
    {
      headers: {
        "User-Agent":
          "ModVault Creator Connector",
        Accept: "text/html",
      },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    }
  );

  // Do not follow redirects to an unexpected host.
  if (
    response.status >= 300 &&
    response.status < 400
  ) {
    const location =
      response.headers.get("location");

    if (location) {
      const redirectUrl = new URL(
        location,
        profileUrl
      );

      if (
        redirectUrl.protocol !== "https:" ||
        !GTAINSIDE_HOSTS.includes(
          redirectUrl.hostname.toLowerCase()
        )
      ) {
        throw new Error(
          "GTAinside redirected to an unexpected host."
        );
      }
    }

    throw new Error(
      "GTAinside redirected the profile request. Try again later."
    );
  }

  if (!response.ok) {
    throw new Error(
      `GTAinside returned HTTP ${response.status}.`
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    throw new Error(
      "GTAinside did not return an HTML profile."
    );
  }

  return response.text();
}

function decodeHtml(
  value: string
): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ");
}

function extractAboutMe(
  html: string
): string | null {
  /*
   * Locate the About Me heading, then inspect
   * the content immediately following it.
   *
   * We deliberately avoid checking the entire
   * page: a code elsewhere on the page should
   * not prove control of the profile.
   */
  const headingPattern =
    /<h[1-6]\b[^>]*>\s*About\s+me\s*<\/h[1-6]>/i;

  const headingMatch =
    headingPattern.exec(html);

  if (!headingMatch) {
    return null;
  }

  const afterHeading =
    html.slice(
      headingMatch.index +
      headingMatch[0].length
    );

  // Stop at the next section heading.
  const nextHeading =
    /<h[1-6]\b[^>]*>/i.exec(afterHeading);

  const sectionHtml = nextHeading
    ? afterHeading.slice(
        0,
        nextHeading.index
      )
    : afterHeading.slice(0, 10000);

  return decodeHtml(
    sectionHtml
      .replace(
        /<script\b[^>]*>[\s\S]*?<\/script>/gi,
        ""
      )
      .replace(
        /<style\b[^>]*>[\s\S]*?<\/style>/gi,
        ""
      )
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

export const gtaInsideConnector:
  PlatformConnector = {
    async discover(
      _profileUrl: string
    ): Promise<DiscoveredProject[]> {
      /*
       * GTAinside discovery is not implemented
       * yet. Verification support is independent.
       */
      return [];
    },

    verification: {
      instructions: async () =>
        "Edit your public GTAinside profile and append your ModVault verification code to the About Me section. Save your profile, then return here and click Check Verification. You can remove the code after verification succeeds.",

      start: async (profileUrl: string) => ({
        supported: isValidProfileUrl(profileUrl),
      }),

      check: async (
        profileUrl: string,
        verificationCode: string
      ): Promise<boolean> => {
        if (
          !/^[A-Z0-9-]{6,20}$/.test(
            verificationCode
          )
        ) {
          return false;
        }

        try {
          const html =
            await fetchProfile(profileUrl);

          const aboutMe =
            extractAboutMe(html);

          return (
            aboutMe !== null &&
            aboutMe.includes(
              verificationCode
            )
          );
        } catch (error) {
          console.error(
            "GTAINSIDE VERIFICATION ERROR:",
            error
          );

          return false;
        }
      },
    },
  };