import type {
  DiscoveredProject,
  PlatformConnector,
} from "./types";

import {
  getGta5ModsVerificationInstructions,
} from "./gta5modsVerification";

function normalizeUrl(
  href: string
): string {

  if (
    href.startsWith("http")
  ) {
    return href;
  }

  return `https://www.gta5-mods.com${href}`;

}


function extractExternalId(
  projectUrl: string
): string {

  const cleanUrl =
    projectUrl.split("?")[0];

  const parts =
    cleanUrl
      .split("/")
      .filter(Boolean);

  return (
    parts[parts.length - 1] ||
    projectUrl
  );

}


function decodeHtmlEntities(
  value: string
): string {

  return value
    .replace(
      /&amp;/g,
      "&"
    )
    .replace(
      /&quot;/g,
      '"'
    )
    .replace(
      /&#39;/g,
      "'"
    )
    .replace(
      /&#x27;/gi,
      "'"
    )
    .replace(
      /&lt;/g,
      "<"
    )
    .replace(
      /&gt;/g,
      ">"
    );
}


function cleanText(
  html: string
): string {

  return decodeHtmlEntities(
    html
      .replace(
        /<script[\s\S]*?<\/script>/gi,
        ""
      )
      .replace(
        /<style[\s\S]*?<\/style>/gi,
        ""
      )
      .replace(
        /<svg[\s\S]*?<\/svg>/gi,
        ""
      )
      .replace(
        /<[^>]+>/g,
        ""
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim()
  );

}


/*
  Extract the actual project title from
  the GTA5-Mods card.

  We deliberately DO NOT use all visible
  anchor text because that also contains:

    rating
    downloads
    likes
    version information
    other card metadata
*/


function extractProjectTitle(
  anchorHtml: string
): string {

  /*
    GTA5-Mods commonly puts the project name
    inside an element whose class contains
    "title".

    This is the first thing we want to use.
  */

  const titleClassRegex =
    /<(?:div|span|p|strong|h1|h2|h3|h4|h5|h6)\b[^>]*class=["'][^"']*\btitle\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|span|p|strong|h1|h2|h3|h4|h5|h6)>/gi;

  let match;

  while (
    (match =
      titleClassRegex.exec(anchorHtml))
    !== null
  ) {

    const title =
      cleanText(
        match[1]
      );

    if (
      title.length > 1
    ) {
      return title;
    }

  }


  /*
    Some cards may use a class containing
    "name" rather than "title".
  */

  const nameClassRegex =
    /<(?:div|span|p|strong|h1|h2|h3|h4|h5|h6)\b[^>]*class=["'][^"']*\bname\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|span|p|strong|h1|h2|h3|h4|h5|h6)>/gi;

  while (
    (match =
      nameClassRegex.exec(anchorHtml))
    !== null
  ) {

    const title =
      cleanText(
        match[1]
      );

    if (
      title.length > 1
    ) {
      return title;
    }

  }


  /*
    Fallback.

    If the title element cannot be found,
    use the visible text but remove the
    trailing card statistics.

    Example:

      Car Audi Add-On 5.0 9,107 58

    becomes:

      Car Audi Add-On
  */

  let text =
    cleanText(
      anchorHtml
    );


  /*
    Remove trailing:

      rating
      downloads
      likes

    Examples:

      5.0 9,107 58
      4.74 139,770 693
      4.9 13,675 129
  */

  text =
    text.replace(
      /\s+\d(?:\.\d{1,2})?\s+[\d,]+\s+[\d,]+\s*$/,
      ""
    );


  return text.trim();

}


function isProjectUrl(
  projectUrl: string
): boolean {

  try {

    const url =
      new URL(projectUrl);

    const hostname =
      url.hostname.toLowerCase();


    /*
      Only GTA5-Mods URLs.
    */

    if (
      hostname !==
        "www.gta5-mods.com" &&
      hostname !==
        "gta5-mods.com"
    ) {
      return false;
    }


    const path =
      url.pathname
        .toLowerCase()
        .replace(
          /\/+$/,
          ""
        );


    /*
      Site-level pages.
    */

    const ignoredPaths = [

      "",

      "/",

      "/files",

      "/upload",

      "/login",

      "/register",

      "/search",

      "/about",

      "/contact",

      "/faq",

      "/forums",

      "/downloads",

      "/privacy",

      "/terms",

      "/featured",

      "/most-liked",

      "/most-downloaded",

      "/highest-rated",

    ];


    if (
      ignoredPaths.includes(
        path
      )
    ) {
      return false;
    }


    /*
      User profiles and everything
      underneath them are NOT projects.
    */

    if (
      path.startsWith(
        "/users/"
      )
    ) {
      return false;
    }


    /*
      Site infrastructure.
    */

    const ignoredPrefixes = [

      "/assets/",

      "/css/",

      "/js/",

      "/images/",

      "/img/",

      "/static/",

      "/api/",

      "/cdn/",

      "/account/",

      "/admin/",

      "/auth/",

    ];


    if (
      ignoredPrefixes.some(
        (prefix) =>
          path.startsWith(
            prefix
          )
      )
    ) {
      return false;
    }


    /*
      Static files.
    */

    const ignoredExtensions = [

      ".png",

      ".jpg",

      ".jpeg",

      ".gif",

      ".webp",

      ".svg",

      ".ico",

      ".css",

      ".js",

      ".json",

      ".xml",

      ".woff",

      ".woff2",

      ".ttf",

      ".map",

    ];


    if (
      ignoredExtensions.some(
        (extension) =>
          path.endsWith(
            extension
          )
      )
    ) {
      return false;
    }


    /*
      Real GTA5-Mods projects have:

        /category/project
    */

    const segments =
      path
        .split("/")
        .filter(Boolean);


    if (
      segments.length !== 2
    ) {
      return false;
    }


    const category =
      segments[0];

    const slug =
      segments[1];


    /*
      Reject navigation slugs.
    */

    const ignoredSlugs = [

      "featured",

      "most-liked",

      "most-downloaded",

      "highest-rated",

      "latest",

      "popular",

      "new",

      "1",

      "2",

      "3",

      "4",

      "5",

    ];


    if (
      ignoredSlugs.includes(
        slug
      )
    ) {
      return false;
    }


    /*
      Reject navigation categories.
    */

    const ignoredCategories = [

      "users",

      "user",

      "search",

      "login",

      "register",

      "forums",

      "forum",

      "downloads",

      "download",

      "upload",

      "account",

      "admin",

      "api",

      "assets",

      "static",

    ];


    if (
      ignoredCategories.includes(
        category
      )
    ) {
      return false;
    }


    return true;

  } catch {

    return false;

  }

}



function extractProjects(
  html: string
): DiscoveredProject[] {

  const projects: DiscoveredProject[] = [];

  const seen =
    new Set<string>();

  /*
    GTA5-Mods file cards expose the exact
    project title in the title attribute
    of the project link.

    Example:

    <a
      href="/vehicles/..."
      title="2019 Ford Mustang GT Convertible [Add-On / FiveM | Animated Roof]"
    >

    We use that title directly so that
    capitalization, brackets, punctuation,
    spacing, etc. are preserved.
  */

  const linkRegex =
    /<a\b[^>]*href=["']([^"']+)["'][^>]*title=["']([^"']+)["'][^>]*>/gi;

  let match;

  while (
    (match = linkRegex.exec(html))
    !== null
  ) {

    const href =
      match[1];

    const sourceTitle =
      match[2];

    if (
      !href ||
      !sourceTitle
    ) {
      continue;
    }

    const projectUrl =
      normalizeUrl(href);

    const cleanUrl =
      projectUrl
        .split("?")[0]
        .split("#")[0];

    if (
      !isProjectUrl(
        cleanUrl
      )
    ) {
      continue;
    }

    if (
      seen.has(
        cleanUrl
      )
    ) {
      continue;
    }

    seen.add(
      cleanUrl
    );

    const externalId =
      extractExternalId(
        cleanUrl
      );

    projects.push({

      platform:
        "gta5mods",

      externalId,

      title:
        decodeHtmlEntities(
          sourceTitle.trim()
        ),

      projectUrl:
        cleanUrl,

      imageUrl:
        null,

    });

  }

  return projects;
}


async function fetchPage(
  url: string
): Promise<string> {

  const response =
    await fetch(
      url,
      {
        headers: {

          "User-Agent":
            "ModVault Creator Connector",

        },

        cache:
          "no-store",

      }
    );


  if (
    !response.ok
  ) {

    throw new Error(
      `GTA5-Mods returned ${response.status}`
    );

  }


  return response.text();

}


export const gta5ModsConnector:
  PlatformConnector = {

  verification: {

  instructions: async () =>
    getGta5ModsVerificationInstructions(),

  start: async () => {
    return {
      supported: true,
    };
  },

  check: async () => {
    return false;
  },

},

  async discover(
    profileUrl: string
  ): Promise<DiscoveredProject[]> {

    const allProjects:
      DiscoveredProject[] = [];

    const seenProjects =
      new Set<string>();


    /*
      The creator profile only exposes a
      limited Latest Mods section.

      The complete creator listing lives at:

        /users/{username}/files

      and is paginated.
    */

    const profileBase =
      profileUrl
        .split("?")[0]
        .replace(
          /\/+$/,
          ""
        );


    const filesUrl =
      profileBase.endsWith(
        "/files"
      )
        ? profileBase
        : `${profileBase}/files`;


    const maxPages =
      20;


    for (
      let page = 1;
      page <= maxPages;
      page++
    ) {

      const pageUrl =
        page === 1
          ? filesUrl
          : `${filesUrl}?page=${page}`;


      let html:
        string;


      try {

        html =
          await fetchPage(
            pageUrl
          );

      } catch (
        error
      ) {

        console.error(
          "GTA5-MODS PAGE ERROR:",
          pageUrl,
          error
        );

        break;

      }


      const projects =
        extractProjects(
          html
        );


      let newProjects =
        0;


      for (
        const project of projects
      ) {

        if (
          seenProjects.has(
            project.externalId
          )
        ) {
          continue;
        }


        seenProjects.add(
          project.externalId
        );


        allProjects.push(
          project
        );


        newProjects++;

      }


      console.log(
        `GTA5-Mods discovery page ${page}: ${newProjects} new projects`
      );


      /*
        No new projects means we've reached
        the end of the creator's listing.
      */

      if (
        newProjects === 0
      ) {
        break;
      }

    }


    console.log(
      `GTA5-Mods discovery complete: ${allProjects.length} projects`
    );


    return allProjects;

  },

};