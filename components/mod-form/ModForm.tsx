import UploadBasicSection from "@/components/upload/UploadBasicSection";
import UploadMediaSection from "@/components/upload/UploadMediaSection";
import UploadLinksSection from "@/components/upload/UploadLinksSection";
import UploadDetailsSection from "@/components/upload/UploadDetailsSection";
import UploadSubmitSection from "@/components/upload/UploadSubmitSection";
import StatusSelector from "@/components/mod-form/StatusSelector";
import UploadMonetizationSection from "@/components/upload/UploadMonetizationSection";

import DangerZone from "@/components/mod-form/DangerZone";

type Props = {

  form: any;

  setForm: any;

  handleChange: any;

  handleSubmit: any;

  loading: boolean;

  /* OPTIONAL */

  collaboratorsSection?: React.ReactNode;

  creatorSelector?: React.ReactNode;

  dangerZone?: boolean;

  handleDelete?: any;

};

export default function ModForm({

  form,
  setForm,

  handleChange,
  handleSubmit,

  loading,

  collaboratorsSection,

  creatorSelector,

  dangerZone = false,

  handleDelete,

}: Props) {

  return (

    <form
      onSubmit={
        handleSubmit
      }
      className="
        space-y-10
      "
    >

      {/* CREATOR SELECTOR */}
      {creatorSelector}

      {/* STATUS */}
      <StatusSelector
        form={form}
        handleChange={handleChange}
      />

      {/* CATEGORY */}
      <section
        className="
          rounded-3xl
          border
          border-white/10
          bg-white/[0.02]
          p-6
        "
      >

        <div
          className="
            mb-6
          "
        >

          <p
            className="
              text-xs
              uppercase
              tracking-[0.3em]
              text-purple-400
            "
          >
            Category
          </p>

          <h2
            className="
              mt-2
              text-3xl
              font-bold
            "
          >
            Mod Category
          </h2>

        </div>

        <select

          name="category"

          value={
            form.category || ""
          }

          onChange={
            handleChange
          }

          className="
            w-full
            rounded-2xl
            border
            border-white/10
            bg-black/40
            px-4
            py-3
            text-white
            outline-none
          "
        >

          <option value="">
            Select category
          </option>

          <option value="vehicles">
            Vehicles
          </option>

          <option value="maps">
            Maps
          </option>

          <option value="scripts">
            Scripts
          </option>

          <option value="graphics">
            Graphics
          </option>

          <option value="weapons">
            Weapons
          </option>

          <option value="player">
            Player
          </option>

          <option value="sounds">
            Sounds
          </option>

          <option value="ui">
            UI
          </option>

          <option value="tools">
            Tools
          </option>

          <option value="misc">
            Misc
          </option>

        </select>

      </section>

      {/* BASIC */}
      <UploadBasicSection
        form={form}
        handleChange={
          handleChange
        }
      />

      {/* COLLABORATORS */}
      {collaboratorsSection}

      {/* MEDIA */}
      <UploadMediaSection
        form={form}
        setForm={setForm}
      />

      {/* LINKS */}
      <UploadLinksSection
        form={form}
        handleChange={
          handleChange
        }
      />

      {/* MONETIZATION */}
      <UploadMonetizationSection
        form={form}
        handleChange={handleChange}
      />

      {/* DETAILS */}
      <UploadDetailsSection
        form={form}
        handleChange={
          handleChange
        }
      />

      {/* DELETE */}
      {dangerZone && (

        <DangerZone
          handleDelete={
            handleDelete
          }
        />

      )}

      {/* SUBMIT */}
      <UploadSubmitSection
        loading={loading}
      />

    </form>

  );

}