import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const { error } = await supabase.rpc("increment_downloads", {
      row_id: id, // ✅ MUST match your SQL function
    });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}