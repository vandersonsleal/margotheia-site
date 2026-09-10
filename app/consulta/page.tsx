"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Intake = {
  acknowledgement: string;
  detected_topic: string;
  refined_question: string;
  recommended_oracle: "tarot-marseille" | "petit-lenormand";
  recommendation_reason: string;
  safety_note?: string;
};

type DrawnCard = {
  draw_order: number;
  position_name: string;
  name: string;
  slug: string;
  is_reversed: boolean;
};

type Interpretation = {
  overview?: string;
  positions?: Array<{ position_name?: string; card_name?: string; interpretation?: string }>;
  relationships?: string;
  patterns?: string;
  synthesis?: string;
  guidance?: string;
};

const topics = [
  "Amor & Relacionamentos",
  "Sentimentos & Intenções",
  "Reconciliação",
  "Trabalho & Carreira",
  "Dinheiro & Prosperidade",
  "Decisões & Caminhos",
  "Espiritualidade",
  "Autoconhecimento",
  "Meu momento atual",
];

export default function ConsultaPage() {
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const [intake, setIntake] = useState<Intake | null>(null);
  const [oracle, setOracle] = useState<"tarot-marseille" | "petit-lenormand">("tarot-marseille");
  const [reversed, setReversed] = useState(false);
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [interpretation, setInterpretation] = useState<Interpretation | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function ensureSession() {
    const supabase = createClient();
    const { data: current, error: currentError } = await supabase.auth.getSession();
    if (currentError) throw currentError;
    if (current.session) return supabase;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    if (!data.session) throw new Error("A sessão anônima não foi criada.");
    return supabase;
  }

  async function listen() {
    setMessage("Clique recebido. Iniciando sua sessão privada...");
    if (!question.trim() && topic !== "Meu momento atual") {
      setMessage("Escreva sua pergunta ou escolha “Meu momento atual”.");
      return;
    }

    setBusy(true);
    try {
      const supabase = await ensureSession();
      setMessage("Lunah está ouvindo sua questão...");
      const { data, error } = await supabase.functions.invoke("lunah-intake", {
        body: { question: question.trim(), topic },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.detail || data.error);
      if (!data?.intake) throw new Error("A resposta de Lunah veio vazia.");

      setIntake(data.intake);
      setOracle(data.intake.recommended_oracle || "tarot-marseille");
      setMessage("");
    } catch (error) {
      console.error("lunah-intake", error);
      setMessage(error instanceof Error ? error.message : "Não foi possível conversar com Lunah.");
    } finally {
      setBusy(false);
    }
  }

  async function draw() {
    if (!intake) return;
    setBusy(true);
    setMessage("Preparando sua tiragem...");
    try {
      const supabase = await ensureSession();
      const { data, error } = await supabase.functions.invoke("start-free-reading", {
        body: {
          question: question.trim() || "Leitura geral do momento atual",
          refined_question: intake.refined_question,
          topic: intake.detected_topic || topic,
          oracle,
          reversed_enabled: oracle === "tarot-marseille" ? reversed : false,
        },
      });
      if (error) throw error;
      if (data?.signup_required) throw new Error("Esta sessão já utilizou a leitura gratuita. Crie sua conta para continuar.");
      if (data?.error) throw new Error(data.detail || data.error);
      setReadingId(data.reading_id);
      setCards(data.cards || []);
      setMessage("");
    } catch (error) {
      console.error("start-free-reading", error);
      setMessage(error instanceof Error ? error.message : "Não foi possível preparar sua tiragem.");
    } finally {
      setBusy(false);
    }
  }

  async function interpret() {
    if (!readingId) return;
    setBusy(true);
    setMessage("Lunah está reunindo os símbolos da sua tiragem...");
    try {
      const supabase = await ensureSession();
      const { data, error } = await supabase.functions.invoke("lunah-reading", {
        body: { reading_id: readingId, depth: "balanced" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.detail || data.error);
      setInterpretation(data.interpretation);
      setMessage("");
    } catch (error) {
      console.error("lunah-reading", error);
      setMessage(error instanceof Error ? error.message : "Lunah não conseguiu concluir a interpretação.");
    } finally {
      setBusy(false);
    }
  }

  if (interpretation) {
    return (
      <main className="shell section consultation-page result-page">
        <div className="eyebrow">Sua leitura com Lunah</div>
        <h1 className="page-title small">O centro da sua leitura</h1>
        <p className="lead question-display">“{intake?.refined_question || question || "Leitura geral do momento atual"}”</p>
        <div className="spread-cards">
          {cards.map((card) => (
            <article className="oracle-card" key={`${card.slug}-${card.draw_order}`}>
              <span>{card.position_name}</span>
              <strong>{card.name}</strong>
              {card.is_reversed && <em>Invertida</em>}
            </article>
          ))}
        </div>
        {interpretation.overview && <section className="reading-section"><h2>O que esta tiragem revela primeiro</h2><p>{interpretation.overview}</p></section>}
        {!!interpretation.positions?.length && <section className="reading-section"><h2>Leitura das posições</h2>{interpretation.positions.map((p, i) => <article className="reading-card" key={i}><h3>{p.position_name} — {p.card_name}</h3><p>{p.interpretation}</p></article>)}</section>}
        {interpretation.relationships && <section className="reading-section"><h2>Como essas cartas conversam</h2><p>{interpretation.relationships}</p></section>}
        {interpretation.patterns && <section className="reading-section"><h2>Padrões</h2><p>{interpretation.patterns}</p></section>}
        {interpretation.synthesis && <section className="reading-section"><h2>Síntese</h2><p>{interpretation.synthesis}</p></section>}
        {interpretation.guidance && <section className="reading-section emphasis"><h2>O que merece sua atenção agora</h2><p>{interpretation.guidance}</p></section>}
        <div className="actions"><Link className="button primary" href="/auth/sign-up">Criar conta e salvar minha jornada</Link><Link className="button" href="/">Voltar ao início</Link></div>
      </main>
    );
  }

  if (cards.length) {
    return (
      <main className="shell section consultation-page zone">
        <div className="eyebrow">Zona Oracular</div>
        <h1 className="page-title small">As cartas estão sobre a mesa.</h1>
        <div className="spread-cards">
          {cards.map((card) => (
            <article className="oracle-card" key={`${card.slug}-${card.draw_order}`}>
              <span>{card.position_name}</span><strong>{card.name}</strong>{card.is_reversed && <em>Invertida</em>}
            </article>
          ))}
        </div>
        <button type="button" className="button primary" onClick={interpret} disabled={busy}>{busy ? "Processando..." : "Interpretar minha tiragem"}</button>
        {message && <p className="status-message">{message}</p>}
      </main>
    );
  }

  if (intake) {
    return (
      <main className="shell section consultation-page">
        <div className="eyebrow">Lunah compreendeu sua questão</div>
        <h1 className="page-title small">Antes das cartas, confirme sua consulta.</h1>
        <div className="lunah-response"><span>Lunah</span><p>{intake.acknowledgement}</p></div>
        <div className="consult-summary">
          <div><small>Pergunta</small><strong>{intake.refined_question}</strong></div>
          <div><small>Tema</small><strong>{intake.detected_topic}</strong></div>
          <div><small>Recomendação</small><strong>{intake.recommendation_reason}</strong></div>
        </div>
        <div className="oracle-choice">
          <button type="button" className={`oracle-option ${oracle === "tarot-marseille" ? "active" : ""}`} onClick={() => setOracle("tarot-marseille")}><strong>Tarot de Marselha</strong><span>Arquétipos e processos internos.</span></button>
          <button type="button" className={`oracle-option ${oracle === "petit-lenormand" ? "active" : ""}`} onClick={() => setOracle("petit-lenormand")}><strong>Petit Lenormand</strong><span>Dinâmica concreta e acontecimentos.</span></button>
        </div>
        {oracle === "tarot-marseille" && <label className="checkline inversion-choice"><input type="checkbox" checked={reversed} onChange={(e) => setReversed(e.target.checked)} /><span>Permitir cartas invertidas</span></label>}
        <div className="actions"><button type="button" className="button primary" onClick={draw} disabled={busy}>{busy ? "Preparando..." : "Preparar minha consulta"}</button><button type="button" className="button" onClick={() => { setIntake(null); setMessage(""); }}>Editar pergunta</button></div>
        {message && <p className="status-message">{message}</p>}
      </main>
    );
  }

  return (
    <main className="shell section consultation-page">
      <div className="eyebrow">Encontro com Lunah · Beta 0.2.1</div>
      <h1 className="page-title">O que trouxe você até aqui?</h1>
      <p className="lead">Você pode contar com suas próprias palavras. Lunah escuta antes de revelar.</p>
      <div className="topic-grid">
        {topics.map((item) => <button type="button" key={item} className={`topic-chip ${topic === item ? "active" : ""}`} onClick={() => setTopic(item)}>{item}</button>)}
      </div>
      <div className="consult-box">
        <label htmlFor="question" className="field-label">Conte para Lunah o que você gostaria de compreender.</label>
        <textarea id="question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Conte o que está acontecendo ou qual situação deseja compreender melhor..." />
        <div className="actions">
          <button type="button" className="button primary" onClick={listen} disabled={busy}>{busy ? "Lunah está ouvindo..." : "Conversar com Lunah"}</button>
          <Link className="button" href="/">Voltar</Link>
        </div>
        <p className="hint">Sem cadastro para a primeira consulta.</p>
        {message && <p className="status-message">{message}</p>}
      </div>
    </main>
  );
}
