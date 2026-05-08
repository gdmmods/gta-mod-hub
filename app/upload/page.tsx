"use client";

import Link from "next/link";
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
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
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
    <main className="min-h-screen bg-black text-white">

      {/* NAVBAR */}
      <div className="flex justify-between items-center px-10 py-6 border-b border-zinc-800">

        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
        >
          <span className="text-purple-500"></span> ModVault
        </Link>

        <div className="flex gap-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition">
            Mods
          </Link>

          <Link href="/creators" className="hover:text-white transition">
            Creators
          </Link>

          <Link href="/roadmap" className="hover:text-white transition">
            Roadmap
          </Link>

          <Link href="/about" className="hover:text-white transition">
            About
          </Link>
        </div>
      </div>

      {/* HERO */}
      <div className="max-w-6xl mx-auto px-6 pt-16">

        <p className="text-purple-400 text-sm tracking-[0.2em] mb-3">
          CREATOR UPLOAD
        </p>

        <h1 className="text-5xl font-bold leading-tight">
          Publish your mod.
          <br />
          Showcase your work properly.
        </h1>

        <p className="mt-6 text-lg text-gray-400 max-w-3xl leading-relaxed">
          ModVault is designed to help creators present
          their projects in a cleaner, more premium way.
          Better presentation means better discovery.
        </p>

      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-14 grid lg:grid-cols-[1fr_320px] gap-8">

        {/* FORM */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.35)]">

          <form
            onSubmit={handleSubmit}
            className="space-y-10"
          >

            {/* BASIC */}
            <div>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  Basic Information
                </h2>

                <div className="text-xs text-gray-500">
                  Required fields marked automatically
                </div>
              </div>

              <div className="space-y-6">

                {/* TITLE */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mod Title
                  </label>

                  <input
                    name="title"
                    placeholder='Example: "2017 Ferrari J50 [Add-On]"'
                    value={form.title}
                    onChange={handleChange}
                    className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition"
                    required
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    Use a clean and searchable title.
                  </p>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>

                  <textarea
                    name="description"
                    placeholder="Describe the mod, quality level, compatibility, or unique details..."
                    value={form.description}
                    onChange={handleChange}
                    rows={6}
                    className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition resize-none"
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    Better descriptions improve visibility and trust.
                  </p>
                </div>

                {/* CREATOR */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Creator Name
                  </label>

                  <input
                    name="creator"
                    placeholder='Example: "Asyr0n"'
                    value={form.creator}
                    onChange={handleChange}
                    className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition"
                    required
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    Use the same creator name consistently.
                  </p>
                </div>

              </div>
            </div>

            {/* MEDIA */}
            <div>

              <h2 className="text-xl font-semibold mb-6">
                Media
              </h2>

              <div className="space-y-6">

                {/* MAIN IMAGE */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Main Image URL
                  </label>

                  <input
                    name="image"
                    placeholder="https://example.com/image.jpg"
                    value={form.image}
                    onChange={handleChange}
                    className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition"
                    required
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    This image appears on cards, trending sections, and previews.
                  </p>
                </div>

                {/* EXTRA IMAGES */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Extra Images
                  </label>

                  <textarea
                    name="images"
                    placeholder=''
                    value={form.images}
                    onChange={handleChange}
                    rows={4}
                    className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition resize-none"
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    Add multiple preview images using JSON array format.
                  </p>
                </div>

              </div>
            </div>

            {/* LINKS */}
            <div>

              <h2 className="text-xl font-semibold mb-6">
                Links
              </h2>

              <div className="space-y-6">

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Source URL
                  </label>

                  <input
                    name="source_url"
                    placeholder="https://gta5-mods.com/..."
                    value={form.source_url}
                    onChange={handleChange}
                    className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition"
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    Original source page or creator profile.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Download URL
                  </label>

                  <input
                    name="download_url"
                    placeholder="https://download-link.com/..."
                    value={form.download_url}
                    onChange={handleChange}
                    className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition"
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    Direct download or external download page.
                  </p>
                </div>

              </div>
            </div>

            {/* DETAILS */}
            <div>

              <h2 className="text-xl font-semibold mb-6">
                Additional Details
              </h2>

              <div className="space-y-6">

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Features
                  </label>

                  <textarea
                    name="features"
                    placeholder={`Full HQ Interior
LOD Support
Custom Handling`}
                    value={form.features}
                    onChange={handleChange}
                    rows={5}
                    className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition resize-none"
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    Add one feature per line.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Requirements
                  </label>

                  <textarea
                    name="requirements"
                    placeholder={`Game Build 3095
FiveM Compatible`}
                    value={form.requirements}
                    onChange={handleChange}
                    rows={4}
                    className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition resize-none"
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    Mention dependencies or compatibility requirements.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    placeholder="Known issues, limitations, installation notes..."
                    value={form.notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition resize-none"
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    Optional information shown on the mod page.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Credits
                  </label>

                  <textarea
                    name="credits"
                    placeholder={`Adapted by...
Converted by...
Original model by...`}
                    value={form.credits}
                    onChange={handleChange}
                    rows={4}
                    className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition resize-none"
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    Credit collaborators and original creators properly.
                  </p>
                </div>

              </div>
            </div>

            {/* SUBMIT */}
            <div className="pt-2">

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  bg-gradient-to-r
                  from-purple-600
                  to-purple-500
                  hover:opacity-90
                  transition
                  text-white
                  font-semibold
                  px-6
                  py-4
                  rounded-xl
                  shadow-[0_0_25px_rgba(168,85,247,0.25)]
                "
              >
                {loading
                  ? "Uploading..."
                  : "Publish Mod"}
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                By publishing, you confirm that you own or have permission to share this content.
              </p>

            </div>

          </form>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">

          {/* TIPS */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

            <h3 className="text-lg font-semibold mb-4">
              Creator Tips
            </h3>

            <ul className="space-y-3 text-sm text-gray-400">
              <li>• Use high-quality preview images</li>
              <li>• Keep titles clean and readable</li>
              <li>• Add detailed feature lists</li>
              <li>• Credit collaborators properly</li>
              <li>• Include working download links</li>
            </ul>

          </div>

          {/* PREMIUM NOTE */}
          <div className="bg-gradient-to-br from-purple-500/10 to-zinc-900 border border-purple-500/20 rounded-3xl p-6">

            <p className="text-sm text-purple-300 mb-2">
              Visibility Matters
            </p>

            <p className="text-sm text-gray-400 leading-relaxed">
              Mods with stronger presentation, cleaner screenshots,
              and better descriptions are more likely to gain traction
              on the platform.
            </p>

          </div>

          {/* LIVE PREVIEW */}
          {form.image && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4">

              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-400">
                  Live Preview
                </p>

                <span className="text-xs text-green-400">
                  LIVE
                </span>
              </div>

              <img
                src={form.image}
                alt="Preview"
                className="w-full h-44 object-cover rounded-2xl border border-zinc-800"
              />

              <div className="mt-4">
                <p className="font-semibold line-clamp-1">
                  {form.title || "Your mod title"}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  by {form.creator || "Creator"}
                </p>
              </div>

            </div>
          )}

        </div>
      </div>
    </main>
  );
}