export default function DashboardHero({ profileType }: { profileType: "creator" | "team" }) {

  return (

    <div className="mb-14">

      <p
        className="
          text-purple-400
          text-sm
          tracking-[0.2em]
          mb-3
        "
      >
        {profileType === "team" ? "TEAM DASHBOARD" : "CREATOR DASHBOARD"}
      </p>

      <h1
        className="
          text-5xl
          font-bold
        "
      >
        {profileType === "team" ? "Manage your team." : "Manage your uploads."}
      </h1>

    </div>

  );

}
