interface CreatorBioProps {
  bio?: string | null;
  emptyText?: string;
}

export default function CreatorBio({
  bio,
  emptyText = "No creator biography added yet.",
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
        emptyText}
    </p>

  );

}