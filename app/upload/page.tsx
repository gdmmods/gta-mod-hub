"use client";

import { useState } from "react";

export default function UploadPage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    image: "",
    images: "",
    creator: "",
    source_url: "",
    download_url: "",
    features: "",
    requirements: "",
    notes: "",
    credits: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        alert("Upload failed");
      } else {
        alert("Mod uploaded!");
        window.location.href = "/";
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="max-w-2xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">Upload Mod</h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* BASIC */}
          <input
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
            className="w-full p-3 bg-neutral-900 rounded"
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="w-full p-3 bg-neutral-900 rounded"
          />

          <input
            name="image"
            placeholder="Main Image URL"
            value={form.image}
            onChange={handleChange}
            className="w-full p-3 bg-neutral-900 rounded"
            required
          />

          <textarea
            name="images"
            placeholder='Extra images JSON (["url1","url2"])'
            value={form.images}
            onChange={handleChange}
            className="w-full p-3 bg-neutral-900 rounded"
          />

          <input
            name="creator"
            placeholder="Creator"
            value={form.creator}
            onChange={handleChange}
            className="w-full p-3 bg-neutral-900 rounded"
            required
          />

          <input
            name="source_url"
            placeholder="Source URL"
            value={form.source_url}
            onChange={handleChange}
            className="w-full p-3 bg-neutral-900 rounded"
          />

          <input
            name="download_url"
            placeholder="Download URL"
            value={form.download_url}
            onChange={handleChange}
            className="w-full p-3 bg-neutral-900 rounded"
          />

          {/* DETAILS */}
          <textarea
            name="features"
            placeholder="Features (one per line)"
            value={form.features}
            onChange={handleChange}
            className="w-full p-3 bg-neutral-900 rounded"
          />

          <textarea
            name="requirements"
            placeholder="Requirements"
            value={form.requirements}
            onChange={handleChange}
            className="w-full p-3 bg-neutral-900 rounded"
          />

          <textarea
            name="notes"
            placeholder="Notes"
            value={form.notes}
            onChange={handleChange}
            className="w-full p-3 bg-neutral-900 rounded"
          />

          <textarea
            name="credits"
            placeholder="Credits"
            value={form.credits}
            onChange={handleChange}
            className="w-full p-3 bg-neutral-900 rounded"
          />

          {/* SUBMIT AT THE END */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black px-6 py-3 rounded-lg mt-4"
          >
            {loading ? "Uploading..." : "Upload Mod"}
          </button>

        </form>
      </div>
    </main>
  );
}