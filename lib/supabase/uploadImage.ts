import { supabase } from "@/lib/supabase/client";

export async function uploadImage(
  file: File,
  folder: string
) {

  const fileExt =
    file.name
      .split(".")
      .pop();

  const fileName =
    `${crypto.randomUUID()}.${fileExt}`;

  const filePath =
    `${folder}/${fileName}`;

  const {
    error,
  } =
    await supabase.storage
      .from(
        "creator-assets"
      )
      .upload(
        filePath,
        file
      );

  if (error) {

    throw error;

  }

  const {
    data,
  } =
    supabase.storage
      .from(
        "creator-assets"
      )
      .getPublicUrl(
        filePath
      );

  return data.publicUrl;

}