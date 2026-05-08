"use client";

type Props = {
  url: string;
  id: string;
};

export default function DownloadButton({
  url,
  id,
}: Props) {
  const handleClick = async () => {
    console.log("DOWNLOAD CLICKED", id);

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      console.log("API RESPONSE:", res.status);

    } catch (err) {
      console.error(
        "Download tracking failed",
        err
      );
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      onClick={handleClick}
      className="
        w-full
        flex
        items-center
        justify-center
        gap-2
        bg-gradient-to-r
        from-purple-600
        to-purple-500
        hover:opacity-90
        transition
        text-white
        font-semibold
        py-4
        rounded-2xl
        shadow-lg
      "
    >
      ⬇ Download
    </a>
  );
}