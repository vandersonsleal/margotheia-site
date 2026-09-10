"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const INTAKE_COOKIE = "margotheia_intake";

export async function listenWithLunah(formData: FormData) {
  const question = String(formData.get("question") || "").trim();
  const topic = String(formData.get("topic") || "").trim();

  if (!question && topic !== "Meu momento atual") {
    redirect("/consulta?erro=Escreva+uma+pergunta+ou+selecione+Meu+momento+atual");
  }

  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      redirect(`/consulta?erro=${encodeURIComponent("Não foi possível iniciar a sessão anônima: " + error.message)}`);
    }
  }

  const { data, error } = await supabase.functions.invoke("lunah-intake", {
    body: { question, topic: topic || null },
  });

  if (error || data?.error || !data?.intake) {
    const detail = data?.detail || data?.error || error?.message || "Lunah não conseguiu compreender a questão.";
    redirect(`/consulta?erro=${encodeURIComponent(detail)}`);
  }

  const payload = {
    question: question || "Leitura geral do momento atual",
    topic: topic || null,
    intake: data.intake,
  };

  const cookieStore = await cookies();
  cookieStore.set(INTAKE_COOKIE, encodeURIComponent(JSON.stringify(payload)), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 30,
  });

  redirect("/consulta/confirmar");
}

export async function startReading(formData: FormData) {
  const oracle = String(formData.get("oracle") || "tarot-marseille");
  const reversedEnabled = String(formData.get("reversed_enabled") || "") === "on";
  const cookieStore = await cookies();
  const raw = cookieStore.get(INTAKE_COOKIE)?.value;

  if (!raw) redirect("/consulta?erro=Sua+sessão+de+consulta+expirou");

  let stored: any;
  try {
    stored = JSON.parse(decodeURIComponent(raw!));
  } catch {
    redirect("/consulta?erro=Não+foi+possível+recuperar+sua+consulta");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke("start-free-reading", {
    body: {
      question: stored.question,
      refined_question: stored.intake?.refined_question,
      topic: stored.intake?.detected_topic || stored.topic,
      oracle: oracle === "petit-lenormand" ? "petit-lenormand" : "tarot-marseille",
      reversed_enabled: oracle === "tarot-marseille" ? reversedEnabled : false,
    },
  });

  if (data?.signup_required) redirect("/auth/sign-up?origem=consulta-gratuita");
  if (error || data?.error || !data?.reading_id) {
    const detail = data?.detail || data?.error || error?.message || "Não foi possível preparar a tiragem.";
    redirect(`/consulta/confirmar?erro=${encodeURIComponent(detail)}`);
  }

  redirect(`/consulta/tiragem?reading=${encodeURIComponent(data.reading_id)}`);
}

export async function interpretReading(formData: FormData) {
  const readingId = String(formData.get("reading_id") || "").trim();
  if (!readingId) redirect("/consulta?erro=Leitura+não+encontrada");

  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke("lunah-reading", {
    body: { reading_id: readingId, depth: "balanced" },
  });

  if (error || data?.error || !data?.interpretation) {
    const detail = data?.detail || data?.error || error?.message || "Lunah não conseguiu concluir a interpretação.";
    redirect(`/consulta/tiragem?reading=${encodeURIComponent(readingId)}&erro=${encodeURIComponent(detail)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set("margotheia_result", encodeURIComponent(JSON.stringify(data.interpretation)), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 30,
  });

  redirect(`/consulta/resultado?reading=${encodeURIComponent(readingId)}`);
}
