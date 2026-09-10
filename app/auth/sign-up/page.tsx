"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignUp() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    if (!f.get("adult")) {
      setMessage("É necessário confirmar que você tem 18 anos ou mais.");
      setBusy(false);
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: String(f.get("email")),
      password: String(f.get("password")),
      options: { data: { display_name: String(f.get("name")), adult_confirmed: true } },
    });
    setMessage(error ? error.message : "Conta criada. Verifique seu e-mail se a confirmação estiver habilitada.");
    setBusy(false);
  }

  return <main className="shell section"><form className="form" onSubmit={submit}>
    <div className="eyebrow">Sua jornada na Margotheia</div>
    <h1>Criar conta</h1>
    <input name="name" required placeholder="Como deseja ser chamado" />
    <input name="email" type="email" required placeholder="E-mail" />
    <input name="password" type="password" minLength={8} required placeholder="Senha" />
    <label className="checkline"><input name="adult" type="checkbox" /> <span>Declaro ter 18 anos ou mais.</span></label>
    <p className="hint">Ao criar sua conta, você concordará com os Termos e a Política de Privacidade antes do lançamento público. A Margotheia utiliza IA para compor interpretações personalizadas.</p>
    <button className="button primary" disabled={busy}>{busy ? "Criando..." : "Criar minha conta"}</button>
    {message && <p className="hint">{message}</p>}
    <p className="hint">Já tem conta? <Link href="/auth/login">Entrar</Link></p>
  </form></main>;
}
