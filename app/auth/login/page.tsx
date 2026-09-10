"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    setMessage(error ? error.message : "Login realizado. Você já pode continuar sua consulta.");
    setBusy(false);
  }

  return <main className="shell section"><form className="form" onSubmit={submit}>
    <div className="eyebrow">Margotheia</div>
    <h1>Entrar</h1>
    <input name="email" type="email" required placeholder="E-mail" />
    <input name="password" type="password" required placeholder="Senha" />
    <button className="button primary" disabled={busy}>{busy ? "Entrando..." : "Entrar na Margotheia"}</button>
    {message && <p className="hint">{message}</p>}
    <p className="hint">Ainda não tem conta? <Link href="/auth/sign-up">Criar conta gratuita</Link></p>
  </form></main>;
}
