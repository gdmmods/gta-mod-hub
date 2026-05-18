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

      <StatusSelector
        form={form}
        handleChange={handleChange}
    />

      <UploadBasicSection
        form={form}
        handleChange={
          handleChange
        }
      />

      {/* COLLABORATORS */}
      {collaboratorsSection}

      <UploadMediaSection
        form={form}
        setForm={setForm}
      />

      <UploadLinksSection
        form={form}
        handleChange={
          handleChange
        }
      />

      <UploadMonetizationSection
        form={form}
        handleChange={handleChange}
      />

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

      <UploadSubmitSection
        loading={loading}
      />

    </form>

  );

}