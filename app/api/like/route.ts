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
      return NextResponse.json(
        { error: "Missing ID" },
        { status: 400 }
      );
    }

    // ⚠️ temporary user (replace later with auth)
    const user_id = "00000000-0000-0000-0000-000000000000";

    // -----------------------------
    // CHECK EXISTING LIKE (FIXED)
    // -----------------------------
    const { data: existing, error: checkError } = await supabaseServer
      .from("likes")
      .select("id")
      .eq("user_id", user_id)
      .eq("mod_id", id)
      .limit(1);

    if (checkError) {
      console.error("CHECK ERROR:", checkError);
      return NextResponse.json(
        { error: "DB check failed" },
        { status: 500 }
      );
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

      if (deleteError) {
        console.error("DELETE ERROR:", deleteError);
        return NextResponse.json(
          { error: "Delete failed" },
          { status: 500 }
        );
      }

      const { error: rpcError } = await supabaseServer.rpc("decrement_likes", {
        row_id: id,
      });

      if (rpcError) {
        console.error("RPC DECREMENT ERROR:", rpcError);
      }

      return NextResponse.json({ liked: false });
    }

    // -----------------------------
    // LIKE
    // -----------------------------
    const { error: insertError } = await supabaseServer
      .from("likes")
      .insert({
        user_id,
        mod_id: id,
      });

    if (insertError) {
      console.error("INSERT ERROR:", insertError);
      return NextResponse.json(
        { error: "Insert failed" },
        { status: 500 }
      );
    }

    const { error: rpcError } = await supabaseServer.rpc("increment_likes", {
      row_id: id,
    });

    if (rpcError) {
      console.error("RPC INCREMENT ERROR:", rpcError);
    }

    return NextResponse.json({ liked: true });

  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}