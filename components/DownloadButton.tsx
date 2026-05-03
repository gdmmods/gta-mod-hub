"use client";

type Props = {
  url: string;
  id: string;
};

export default function DownloadButton({ url, id }: Props) {
  const handleClick = async () => {
  console.log("DOWNLOAD CLICKED", id); // 👈 ADD THIS

  try {
    const res = await fetch("/api/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    console.log("API RESPONSE:", res.status); // 👈 ADD THIS

  } catch (err) {
    console.error("Download tracking failed", err);
  }
};

  return (
    <a
      href={url}
      target="_blank"
      onClick={handleClick}
      className="bg-white text-black px-5 py-2 rounded-lg"
    >
      Download
    </a>
  );
}