interface CreatorAboutSectionProps {
  tagline?: string | null;
  specialization?: string[] | null;
}

export default function CreatorAboutSection({
  tagline,
  specialization,
}: CreatorAboutSectionProps) {

  return (

    <>

      {tagline && (
  <p
    className="
      mt-5
      text-xl
      text-purple-300
    "
  >
    {tagline}
  </p>
)}

      {specialization && specialization.length > 0 && (

        <div
          className="
            mt-6
            flex
            flex-wrap
            gap-3
          "
        >

          {specialization.map(
            (item) => (

              <div
                key={item}
                className="
                  rounded-2xl
                  border
                  border-purple-500/20
                  bg-purple-500/10
                  px-4
                  py-2
                  text-sm
                  text-purple-300
                "
              >
                {item}
              </div>

            )
          )}

        </div>

      )}

    </>

  );

}