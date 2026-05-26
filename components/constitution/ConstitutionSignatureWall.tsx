"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase/client";

type Signature = {
  id: string;
  signed_at: string;
  creators: {
    id: string;
    name: string;
    avatar: string | null;
    tagline: string | null;
  };
};

export default function ConstitutionSignatureWall() {

  const [
    signatures,
    setSignatures,
  ] = useState<Signature[]>([]);

  const [
    hovered,
    setHovered,
  ] = useState<string | null>(
    null
  );

  useEffect(() => {

  async function loadSignatures() {

    const {
      data,
      error,
    } = await supabase
      .from("constitution_signatures")
      .select(`
        id,
        signed_at,
        creators (
          id,
          name,
          logo_url
        )
      `);

    if (error) {

      console.error(
        "SIGNATURE WALL ERROR:",
        error
      );

    } else {

      setSignatures(
        data || []
      );

    }

  }

  loadSignatures();

}, []);

  return (

  <section
    className="
      relative
      rounded-[40px]
      overflow-hidden
      border
      border-zinc-800
      min-h-[900px]
    "
  >

  {/* Background */}
  <div
    className="
      absolute inset-0
      bg-cover bg-center
    "
    style={{
      backgroundImage:
        "url('/images/constitution-wall-bg.png')",
    }}
  />

  {/* Dark overlay */}
  <div className="absolute inset-0 bg-black/20" />

  {/* Content */}
  <div
    className="
      relative
      z-10
      overflow-visible
      p-14
    "
  >

    {/* logos + text */}
  

        {/* HEADER */}

        <div
          className="
            max-w-xl
            space-y-4
          "
        >

          <p
            className="
              text-sm
              uppercase
              tracking-[0.3em]
              text-violet-400
            "
          >
            Public Signatories
          </p>

          <h2
            className="
              text-5xl
              font-black
              leading-tight
            "
          >
            Creators Who Signed
          </h2>

          <p
            className="
              text-zinc-300
              text-lg
              leading-relaxed
            "
          >
            Creators publicly aligned
            with the principles of
            attribution, preservation,
            ownership, and ethical
            platform development.
          </p>

        </div>

        {/* SIGNATURE LOGOS */}

        <div
          className="
            relative
            mt-24
            grid
            grid-cols-2
            md:grid-cols-4
            xl:grid-cols-5
            gap-16
            place-items-center
          "
        >

          {signatures.map(
            (signature) => (

              <div
                key={signature.id}
                className="
                  relative
                "
                onMouseEnter={() =>
                  setHovered(
                    signature.id
                  )
                }
                onMouseLeave={() =>
                  setHovered(null)
                }
              >

                {/* LOGO */}

                <div
                  className="
                    w-14
                    h-14
                    rounded-full
                    border
                    border-black/40
                    group relative
                    bg-black/30
                    backdrop-blur-md
                    flex
                    items-center
                    justify-center
                    overflow-hidden
                    transition
                    duration-300
                    hover:scale-110
                    hover:border-violet-500
                    hover:shadow-[0_0_40px_rgba(139,92,246,0.45)]
                  "
                >

                  <img
                    src={
                      signature.creators.avatar ||
                      "/placeholder-avatar.png"
                    }
                    alt={
                      signature.creators.name
                    }
                    className="
                      w-full
                      h-full
                      object-cover
                    "
                  />

                </div>

                {/* HOVER CARD */}

                {hovered ===
                  signature.id && (

                  <div
                    className="
                      absolute
                      top-32
                      left-1/2
                      -translate-x-1/2
                      w-72
                      rounded-3xl
                      border
                      border-zinc-800
                      bg-black/90
                      backdrop-blur-xl
                      p-5
                      space-y-4
                      shadow-2xl
                      z-50
                    "
                  >

                    <div
                      className="
                        flex
                        items-center
                        gap-4
                      "
                    >

                      <img
                        src={
                          signature.creators.avatar ||
                          "/placeholder-avatar.png"
                        }
                        alt={
                          signature.creators.name
                        }
                        className="
                          w-14
                          h-14
                          rounded-full
                          object-cover
                        "
                      />

                      <div>

                        <h3
                          className="
                            font-bold
                            text-lg
                          "
                        >
                          {
                            signature.creators.name
                          }
                        </h3>

                        <p
                          className="
                            text-sm
                            text-zinc-500
                          "
                        >
                          {
                            signature.creators.tagline ||
                            "ModVault Creator"
                          }
                        </p>

                      </div>

                    </div>

                    <div
                      className="
                        border-t
                        border-zinc-800
                        pt-4
                        text-sm
                        text-zinc-400
                      "
                    >

                      Signed on{" "}
                      {new Date(
                        signature.signed_at
                      ).toLocaleDateString()}

                    </div>

                  </div>

                )}

              </div>

            )
          )}

        </div>

      </div>

    </section>

  );

}