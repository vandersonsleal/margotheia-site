import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TOKEN = "__nBL3XBYLuh2pepDNCNMY6hlUd8wwLp";

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("token") !== TOKEN) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInAnonymously({
    options: { data: { source: "margotheia_auth_diagnostic" } },
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message, code: error.code ?? null },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    anonymous: data.user?.is_anonymous === true,
    user_suffix: data.user?.id?.slice(-8) ?? null,
  });
}
