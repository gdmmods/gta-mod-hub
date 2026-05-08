import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    console.log("API HIT:", id);

    // ⚠️ TEMP USER (MUST EXIST OR FK WILL FAIL)
    const user_id = "00000000-0000-0000-0000-000000000000";

    // -----------------------------
    // CHECK EXISTING LIKE
    // -----------------------------
    const { data: existing, error: checkError } = await supabaseServer
      .from("likes")
      .select("id")
      .eq("user_id", user_id)
      .eq("mod_id", id)
      .limit(1);

    console.log("EXISTING:", existing, checkError);

    if (checkError) {
      console.error("CHECK ERROR:", checkError);
      return NextResponse.json({ error: "DB check failed" }, { status: 500 });
    }

    const alreadyLiked = existing && existing.length > 0;

    // -----------------------------
    // UNLIKE
    // -----------------------------
    if (alreadyLiked) {
      const { error: deleteError } = await supabaseServer
        .from("likes")
        .delete()
        .eq("user_id", user_id)
        .eq("mod_id", id);

      console.log("DELETE ERROR:", deleteError);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      const { error: rpcError } = await supabaseServer.rpc("decrement_likes", {
        row_id: id,
      });

      console.log("RPC DECREMENT:", rpcError);

      return NextResponse.json({ liked: false });
    }

    // -----------------------------
    // LIKE
    // -----------------------------
    const { data: insertData, error: insertError } = await supabaseServer
      .from("likes")
      .insert({
        user_id,
        mod_id: id,
      })
      .select();

    console.log("INSERT DATA:", insertData);
    console.log("INSERT ERROR:", insertError);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const { error: rpcError } = await supabaseServer.rpc("increment_likes", {
      row_id: id,
    });

    console.log("RPC INCREMENT:", rpcError);

    return NextResponse.json({ liked: true });

  } catch (err: any) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}