interface CreatorBioProps {
  bio?: string | null;
}

export default function CreatorBio({
  bio,
}: CreatorBioProps) {

  return (

    <p
      className="
        mt-6
        max-w-4xl
        text-zinc-400
        leading-relaxed
        text-lg
      "
    >
      {bio ||
        "No creator biography added yet."}
    </p>

  );

}