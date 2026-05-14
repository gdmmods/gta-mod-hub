"use client";

import ImageUploader from "./ImageUploader";
import MultiImageUploader from "./MultiImageUploader";

interface Props {
  form: any;
  setForm: any;
}

export default function UploadMediaSection({
  form,
  setForm,
}: Props) {

  return (

    <div>

      <h2
        className="
          text-xl
          font-semibold
          mb-6
        "
      >
        Media
      </h2>

      <div className="space-y-8">

        {/* MAIN IMAGE */}
        <div>

          <label
            className="
              block
              text-sm
              font-medium
              mb-3
            "
          >
            Main Image
          </label>

          <ImageUploader
            value={form.image}
            onUpload={(url: string) =>
              setForm({
                ...form,
                image: url,
              })
            }
          />

          <p
            className="
              text-xs
              text-gray-500
              mt-3
            "
          >
            This image appears on cards,
            trending sections, search,
            and previews across ModVault.
          </p>

        </div>

        {/* EXTRA IMAGES */}
        <div>

          <label
            className="
              block
              text-sm
              font-medium
              mb-3
            "
          >
            Extra Images
          </label>

          <MultiImageUploader
            value={form.images}
            onUpload={(urls: string[]) =>
              setForm({
                ...form,
                images: JSON.stringify(
                  urls,
                  null,
                  2
                ),
              })
            }
          />

          <p
            className="
              text-xs
              text-gray-500
              mt-3
            "
          >
            Add multiple screenshots,
            previews, cinematics,
            showcase renders, or
            comparison images.
          </p>

        </div>

      </div>

    </div>

  );

}