interface CreatorVerificationBadgeProps {
  verified?: boolean;
}

export default function CreatorVerificationBadge({
  verified,
}: CreatorVerificationBadgeProps) {

  if (!verified) {
    return null;
  }

  return (

    <div
      className="
        px-3
        py-1.5
        rounded-xl
        bg-blue-500/20
        border
        border-blue-500/30
        text-sm
        text-blue-300
      "
    >
      ✔ Verified
    </div>

  );

}