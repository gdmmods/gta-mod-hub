"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase/client";

import {
  useRouter,
} from "next/navigation";

export default function useCreatorSettings(
  creatorId: string
) {

  const router =
  useRouter();

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    loaded,
    setLoaded,
  ] = useState(false);

  const [form, setForm] =
    useState({

      name: "",

      tagline: "",

      bio: "",

      status: "",

      owner_id: "",

      team_id: "",

      owner_type: "user",

      avatar: "",

      banner: "",

      specialization: [] as string[],

      location: "",

      aliases: [] as string[],

      socials: {

        discord: "",

        youtube: "",

        website: "",

        instagram: "",

        twitter: "",

        github: "",

        patreon: "",

        kofi: "",

        store: "",

        support_email: "",

      },

    });

  /* --------------------------------
     LOAD
  -------------------------------- */

  useEffect(() => {

    async function loadCreator() {

      const {
        data: creator,
        error,
      } = await supabase
        .from("creators")
        .select(`
          id,
          name,
          tagline,
          bio,
          status,
          owner_id,
          owner_type,
          team_id,
          avatar,
          banner,
          specialization,
          location,
          socials
        `)
        .eq(
          "id",
          creatorId
        )
        .maybeSingle();

      if (
        error ||
        !creator
      ) {

        console.error(
          "CREATOR SETTINGS LOAD ERROR:",
          JSON.stringify(
            error,
            null,
            2
          )
        );

        return;

      }

      const {
        data: aliasesData,
      } = await supabase
        .from("creator_aliases")
        .select("alias")
        .eq("creator_id", creatorId);

      const socials =
        creator.socials || {};

      setForm({

        name:
          creator.name || "",

        tagline:
          creator.tagline || "",

        bio:
          creator.bio || "",

        status: 
          creator.status || "",

          owner_id:
            creator.owner_id || "",

          team_id:
          creator.team_id || "",

        owner_type:
          creator.owner_type ||
          "user",

        avatar:
          creator.avatar || "",

        banner:
          creator.banner || "",

        specialization:
          Array.isArray(
            creator.specialization
          )
            ? creator.specialization
            : [],

        location:
          creator.location || "",

        aliases:
          aliasesData?.map(
            (a) => a.alias
          ) || [],

        socials: {

          discord:
            socials.discord || "",

          youtube:
            socials.youtube || "",

          website:
            socials.website || "",

          instagram:
            socials.instagram || "",

          twitter:
            socials.twitter || "",

          github:
            socials.github || "",

          patreon:
            socials.patreon || "",

          kofi:
            socials.kofi || "",

          store:
            socials.store || "",

          support_email:
            socials.support_email || "",

        },

      });

      setLoaded(true);

    }

    if (creatorId) {

      loadCreator();

    }

  }, [creatorId]);

  /* --------------------------------
     CHANGE
  -------------------------------- */

  function handleChange(
    e: any
  ) {

    const name =
      e.target.name;

    const value =
      e.target.value;

    /* SOCIALS */
    if (
      name.startsWith(
        "socials."
      )
    ) {

      const socialKey =
        name.replace(
          "socials.",
          ""
        );

      setForm((prev: any) => ({

        ...prev,

        socials: {

          ...prev.socials,

          [socialKey]:
            value,

        },

      }));

      return;

    }

    /* NORMAL FIELDS */
    setForm((prev: any) => ({

      ...prev,

      [name]:
        value,

    }));

  }

  /* --------------------------------
     SAVE
  -------------------------------- */

  async function handleSubmit(
    e: any
  ) {

    e.preventDefault();

    setLoading(true);

    console.log(
      "FINAL FORM:"
    );

    console.log(form);

    console.log(
      "FINAL SOCIALS:"
    );

    console.log(
      form.socials
    );

    console.log("FORM:", form);

    const becomingTeam =
      form.owner_type === "team" &&
      !form.team_id;

      let teamId =
      form.team_id || null;

    const teamSlug =
      form.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-");

      if (becomingTeam) {

        const {
          data: newTeam,
          error: teamError,
        } = await supabase
          .from("teams")
          .insert({

              name: form.name,

              slug:
                teamSlug,

              owner_id:
                creatorId,

            })
          .select()
          .single();

        if (teamError) {

          console.error(
            teamError
          );

          setLoading(false);

          return;
        }

        teamId =
          newTeam.id;

      }

    const {
      data,
      error,
    } = await supabase
      .from("creators")
      .update({

        name:
          form.name,

        tagline:
          form.tagline,

        bio:
          form.bio,

        status:
          form.status,

          team_id:
            teamId,

        owner_type:
          form.owner_type,

        avatar:
          form.avatar,

        banner:
          form.banner,

        specialization:
          form.specialization,

        location:
          form.location,

        socials:
          form.socials,

      })
      .eq(
        "id",
        creatorId
      )
      .select();

      if (!error) {

        await supabase
          .from("creator_aliases")
          .delete()
          .eq(
            "creator_id",
            creatorId
          );

        const uniqueAliases =
          [...new Set(
            form.aliases
              .map((a) => a.trim())
              .filter((a) => a !== "")
          )];

        const aliasesToInsert =
          uniqueAliases.map(
            (alias) => ({
              creator_id:
                creatorId,
              alias,
            })
          );
        

        if (
          aliasesToInsert.length > 0
        ) {

          const {
            error:
              aliasesError,
          } = await supabase
            .from(
              "creator_aliases"
            )
            .insert(
              aliasesToInsert
            );

          if (aliasesError) {

            console.error(
              "ALIASES SAVE ERROR:",
              aliasesError
            );

            alert(
              "Failed to save aliases."
            );

}

        }

      }

    console.log(
      "UPDATE RESULT:"
    );

    console.log(data);

    console.log(
      "UPDATE ERROR:"
    );

    console.log(error);

    if (!error) {

console.log(
  "BECOMING TEAM:",
  becomingTeam
);

console.log(
  "TEAM ID:",
  teamId
);

console.log(
  "FORM TEAM ID:",
  form.team_id
);
const {
  data: founderCreator,
  error: founderError,
} = await supabase
  .from("creators")
  .select("id")
  .eq("owner_id", form.owner_id)
  .eq("owner_type", "user")
  .single();

console.log(
  "FOUNDER CREATOR:",
  founderCreator
);

console.log(
  "FOUNDER ERROR:",
  founderError
);

if (!founderCreator) {

  console.error(
    "Could not locate founder creator."
  );

  setLoading(false);

  return;

}

if (teamId) {

  console.log(
    "TEAM ID:",
    teamId
  );

  const {
    data: existingMember,
    error: existingError,
  } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq(
  "creator_id",
  founderCreator.id
)
    .maybeSingle();

  console.log(
    "EXISTING MEMBER:",
    existingMember
  );

  console.log(
    "EXISTING MEMBER ERROR:",
    existingError
  );

  if (!existingMember) {

    console.log(
      "INSERTING OWNER MEMBER"
    );

    const {
      data: memberData,
      error: memberError,
    } = await supabase
      .from("team_members")
      .insert({

        team_id:
          teamId,

        creator_id:
          founderCreator.id,

        role:
          "owner",

        membership_status:
          "active",

        can_upload:
          true,

        can_manage_members:
          true,

        can_manage_team:
          true,

      })
      .select();

    console.log(
      "TEAM MEMBER DATA:",
      memberData
    );

    console.log(
      "TEAM MEMBER ERROR:",
      memberError
    );

  }

}

  router.push(
    `/creator/${creatorId}`
  );

}

    setLoading(false);

  }

    return {

    form,

    setForm,

    loading,

    loaded,

    handleChange,

    handleSubmit,

  };

}