import UploadPreviewCard from "./UploadPreviewCard";

interface Props {
  form: any;
}

export default function UploadSidebar({
  form,
}: Props) {

  return (

    <div className="space-y-6">

      {/* TIPS */}
      <div
        className="
          bg-zinc-900
          border
          border-zinc-800
          rounded-3xl
          p-6
        "
      >

        <h3
          className="
            text-lg
            font-semibold
            mb-4
          "
        >
          Creator Tips
        </h3>

        <ul
          className="
            space-y-3
            text-sm
            text-gray-400
          "
        >

          <li>
            • Use high-quality preview images
          </li>

          <li>
            • Keep titles clean and readable
          </li>

          <li>
            • Add detailed feature lists
          </li>

          <li>
            • Credit collaborators properly
          </li>

          <li>
            • Include working download links
          </li>

        </ul>

      </div>

      {/* PREMIUM NOTE */}
      <div
        className="
          bg-gradient-to-br
          from-purple-500/10
          to-zinc-900
          border
          border-purple-500/20
          rounded-3xl
          p-6
        "
      >

        <p
          className="
            text-sm
            text-purple-300
            mb-2
          "
        >
          Visibility Matters
        </p>

        <p
          className="
            text-sm
            text-gray-400
            leading-relaxed
          "
        >
          Mods with stronger presentation,
          cleaner screenshots,
          and better descriptions are
          more likely to gain traction
          on the platform.
        </p>

      </div>

      <UploadPreviewCard
        form={form}
      />

    </div>

  );

}