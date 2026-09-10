import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const expected = process.env.DIAGNOSTIC_TOKEN;
  if (!expected || request.nextUrl.searchParams.get("token") !== expected) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const supabase = await createClient();
  let userId: string | null = null;
  let readingId: string | null = null;

  try {
    const { data: auth, error: authError } = await supabase.auth.signInAnonymously({
      options: { data: { source: "margotheia_pipeline_diagnostic" } },
    });
    if (authError || !auth.session || !auth.user) {
      return NextResponse.json({ ok: false, stage: "auth", detail: authError?.message ?? "no_session" });
    }
    userId = auth.user.id;

    const question = "Como posso lidar melhor com uma decisão profissional importante?";
    const { data: intake, error: intakeError } = await supabase.functions.invoke("lunah-intake", {
      body: { question, topic: "Trabalho & Carreira" },
    });
    if (intakeError || intake?.error || !intake?.intake) {
      return NextResponse.json({
        ok: false,
        stage: "intake",
        detail: intake?.detail ?? intake?.error ?? intakeError?.message ?? "unknown",
      });
    }

    const oracle = intake.intake.recommended_oracle === "petit-lenormand" ? "petit-lenormand" : "tarot-marseille";
    const { data: draw, error: drawError } = await supabase.functions.invoke("start-free-reading", {
      body: {
        question,
        refined_question: intake.intake.refined_question,
        topic: intake.intake.detected_topic,
        oracle,
        reversed_enabled: false,
      },
    });
    if (draw?.reading_id) readingId = draw.reading_id;
    if (drawError || draw?.error || !draw?.reading_id) {
      return NextResponse.json({
        ok: false,
        stage: "draw",
        detail: draw?.detail ?? draw?.error ?? drawError?.message ?? "unknown",
      });
    }

    const { data: reading, error: readingError } = await supabase.functions.invoke("lunah-reading", {
      body: { reading_id: draw.reading_id, depth: "balanced" },
    });
    if (readingError || reading?.error || !reading?.interpretation) {
      return NextResponse.json({
        ok: false,
        stage: "interpretation",
        detail: reading?.detail ?? reading?.error ?? readingError?.message ?? "unknown",
        code: reading?.code ?? null,
        cards: Array.isArray(draw.cards) ? draw.cards.map((c: { name: string }) => c.name) : [],
      });
    }

    return NextResponse.json({
      ok: true,
      stage: "complete",
      model: reading.model ?? null,
      prompt_version: reading.prompt_version ?? null,
      cards: Array.isArray(draw.cards) ? draw.cards.map((c: { name: string }) => c.name) : [],
      overview_chars: typeof reading.interpretation?.overview === "string" ? reading.interpretation.overview.length : 0,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, stage: "exception", detail: String(error).slice(0, 500) });
  } finally {
    if (readingId) {
      await supabase.from("reading_messages").delete().eq("reading_id", readingId);
      await supabase.from("reading_interpretations").delete().eq("reading_id", readingId);
      await supabase.from("reading_analysis").delete().eq("reading_id", readingId);
      await supabase.from("reading_cards").delete().eq("reading_id", readingId);
      await supabase.from("readings").delete().eq("id", readingId);
    }
    await supabase.auth.signOut();
  }
}
