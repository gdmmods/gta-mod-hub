interface Props {
  loading: boolean;
}

export default function UploadSubmitSection({
  loading,
}: Props) {

  return (

    <div className="pt-2">

      <button
        type="submit"
        disabled={
          loading
        }
        className="
          w-full
          bg-gradient-to-r
          from-purple-600
          to-purple-500
          text-white
          font-semibold
          px-6
          py-4
          rounded-xl
          hover:opacity-90
          transition
        "
      >

        {loading
          ? "Uploading..."
          : "Publish Mod"}

      </button>

    </div>

  );

}