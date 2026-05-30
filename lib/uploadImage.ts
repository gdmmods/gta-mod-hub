import { supabase } from "@/lib/supabase/client";

export async function uploadImage(
  file: File,
  path: string
): Promise<string | null> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { error } = await supabase.storage
    .from("creator-assets")
    .upload(filePath, file);

  if (error) {
    console.error("UPLOAD ERROR:", error);
    return null;
  }

  const { data } = supabase.storage
    .from("creator-assets")
    .getPublicUrl(filePath);

  return data.publicUrl;
}