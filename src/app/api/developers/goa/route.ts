import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("get_developers_by_city", { p_city: "goa" });
    if (error) {
      console.error("[/api/developers/goa] RPC error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ developers: data ?? [] });
  } catch (err) {
    console.error("[/api/developers/goa]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
