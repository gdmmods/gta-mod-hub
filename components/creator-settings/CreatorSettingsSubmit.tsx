type Props = {
  loading: boolean;
};

export default function CreatorSettingsSubmit({
  loading,
}: Props) {

  return (

    <button
      type="submit"
      disabled={loading}
      className="
        w-full
        rounded-2xl
        bg-purple-600
        hover:bg-purple-500
        transition
        py-4
        font-semibold
        disabled:opacity-50
      "
    >
      {loading
        ? "Saving..."
        : "Save Creator Profile"}
    </button>

  );

}