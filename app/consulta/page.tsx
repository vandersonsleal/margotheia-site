"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const topics = [
  "Amor & Relacionamentos",
  "Sentimentos & Intenções",
  "Reconciliação",
  "Trabalho & Carreira",
  "Dinheiro & Prosperidade",
  "Família & Vínculos",
  "Decisões & Caminhos",
  "Espiritualidade",
  "Autoconhecimento",
  "Mudanças & Novos Ciclos",
  "Meu momento atual",
];

type Intake = {
  acknowledgement: string;
  detected_topic: string;
  intention: string;
  clarity: "clear" | "needs_focus";
  refined_question: string;
  recommended_oracle: "tarot-marseille" | "petit-lenormand";
  recommendation_reason: string;
  suggested_spread: string;
  safety_note: string;
  ready_for_reading: boolean;
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
  positions?: Array<{ position_name?: string; card_name?: string; interpretation?: string; central_symbol?: string }>;
  relationships?: string;
  patterns?: string;
  synthesis?: string;
  guidance?: string;
  follow_up_suggestions?: string[];
};

export default function Consulta() {
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
    const { data } = await supabase.auth.getSession();
    if (data.session) return { supabase, session: data.session };
    const { data: anonData, error } = await supabase.auth.signInAnonymously();
    if (error || !anonData.session) throw new Error(error?.message || "Não foi possível iniciar sua sessão privada.");
    return { supabase, session: anonData.session };
  }

  async function listen() {
    if (!question.trim() && topic !== "Meu momento atual") return;
    setBusy(true);
    setMessage("");
    try {
      const { supabase } = await ensureSession();
      const { data, error } = await supabase.functions.invoke("lunah-intake", {
        body: { question, topic },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.detail || data.error);
      setIntake(data.intake);
      setOracle(data.intake.recommended_oracle);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Não foi possível conversar com Lunah agora.";
      setMessage(text.includes("anonymous") ? "A consulta sem cadastro precisa ser habilitada no Supabase Auth antes do teste." : text);
    } finally {
      setBusy(false);
    }
  }

  async function draw() {
    if (!intake) return;
    setBusy(true);
    setMessage("");
    try {
      const { supabase } = await ensureSession();
      const { data, error } = await supabase.functions.invoke("start-free-reading", {
        body: {
          question: question || "Leitura geral do momento atual",
          refined_question: intake.refined_question,
          topic: intake.detected_topic || topic,
          oracle,
          reversed_enabled: oracle === "tarot-marseille" ? reversed : false,
        },
      });
      if (error) throw error;
      if (data?.signup_required) {
        setMessage("Esta sessão anônima já utilizou a tiragem gratuita. Crie sua conta para continuar sua jornada e preservar esta consulta.");
        return;
      }
      if (data?.error) throw new Error(data.detail || data.error);
      setReadingId(data.reading_id);
      setCards(data.cards || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível preparar a tiragem.");
    } finally {
      setBusy(false);
    }
  }

  async function interpret() {
    if (!readingId) return;
    setBusy(true);
    setMessage("");
    try {
      const { supabase } = await ensureSession();
      const { data, error } = await supabase.functions.invoke("lunah-reading", {
        body: { reading_id: readingId, depth: "balanced" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.detail || data.error);
      setInterpretation(data.interpretation);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lunah não conseguiu concluir a interpretação.");
    } finally {
      setBusy(false);
    }
  }

  if (interpretation) {
    return <main className="shell section consultation-page result-page">
      <div className="eyebrow">Sua leitura com Lunah</div>
      <h1 className="page-title small">O centro da sua leitura</h1>
      <p className="lead question-display">“{intake?.refined_question || question || "Leitura geral do momento atual"}”</p>

      <div className="spread-cards">
        {cards.map(card => <article className={`oracle-card ${card.is_reversed ? "reversed" : ""}`} key={`${card.slug}-${card.draw_order}`}>
          <span>{card.position_name}</span><strong>{card.name}</strong>{card.is_reversed && <em>Invertida</em>}
        </article>)}
      </div>

      <section className="reading-section"><h2>O que esta tiragem revela primeiro</h2><p>{interpretation.overview}</p></section>
      {!!interpretation.positions?.length && <section className="reading-section"><h2>Leitura das posições</h2><div className="reading-grid">{interpretation.positions.map((p, i) => <article className="reading-card" key={i}><span>{p.position_name}</span><h3>{p.card_name}</h3><p>{p.interpretation}</p>{p.central_symbol && <small>Símbolo central: {p.central_symbol}</small>}</article>)}</div></section>}
      {interpretation.relationships && <section className="reading-section"><h2>Como essas cartas conversam entre si</h2><p>{interpretation.relationships}</p></section>}
      {interpretation.patterns && <section className="reading-section"><h2>Padrões desta tiragem</h2><p>{interpretation.patterns}</p></section>}
      {interpretation.synthesis && <section className="reading-section"><h2>O centro da sua leitura</h2><p>{interpretation.synthesis}</p></section>}
      {interpretation.guidance && <section className="reading-section emphasis"><h2>O que merece sua atenção agora</h2><p>{interpretation.guidance}</p></section>}

      <div className="actions"><Link className="button primary" href="/auth/sign-up">Criar conta e salvar minha jornada</Link><Link className="button" href="/">Voltar ao início</Link></div>
      <p className="hint">As cartas são uma ferramenta simbólica e reflexiva. A leitura não substitui orientação médica, jurídica, financeira ou de outros profissionais qualificados.</p>
    </main>;
  }

  if (cards.length) {
    return <main className="shell section consultation-page zone">
      <div className="eyebrow">Zona Oracular</div>
      <h1 className="page-title small">As cartas estão sobre a mesa.</h1>
      <p className="lead question-display">“{intake?.refined_question || question || "Leitura geral do momento atual"}”</p>
      <div className="spread-cards">
        {cards.map(card => <article className={`oracle-card ${card.is_reversed ? "reversed" : ""}`} key={`${card.slug}-${card.draw_order}`}>
          <span>{card.position_name}</span><strong>{card.name}</strong>{card.is_reversed && <em>Invertida</em>}
        </article>)}
      </div>
      <p className="lead">Agora podemos olhar para a leitura como um todo.</p>
      <button className="button primary" onClick={interpret} disabled={busy}>{busy ? "Lunah está reunindo os símbolos..." : "Interpretar minha tiragem"}</button>
      {message && <p className="status-message">{message}</p>}
    </main>;
  }

  if (intake) {
    return <main className="shell section consultation-page">
      <div className="eyebrow">Lunah compreendeu sua questão</div>
      <h1 className="page-title small">Antes das cartas, confirme sua consulta.</h1>
      <div className="lunah-response"><span>Lunah</span><p>{intake.acknowledgement}</p></div>
      <div className="consult-summary">
        <div><small>Pergunta</small><strong>{intake.refined_question}</strong></div>
        <div><small>Tema</small><strong>{intake.detected_topic}</strong></div>
        <div><small>Por que este oráculo</small><strong>{intake.recommendation_reason}</strong></div>
      </div>

      <div className="oracle-choice">
        <button className={`oracle-option ${oracle === "tarot-marseille" ? "active" : ""}`} onClick={() => setOracle("tarot-marseille")}><strong>Tarot de Marselha</strong><span>Arquétipos, processos internos e caminhos.</span></button>
        <button className={`oracle-option ${oracle === "petit-lenormand" ? "active" : ""}`} onClick={() => setOracle("petit-lenormand")}><strong>Petit Lenormand</strong><span>Dinâmica concreta, acontecimentos e relações.</span></button>
      </div>

      {oracle === "tarot-marseille" && <label className="checkline inversion-choice"><input type="checkbox" checked={reversed} onChange={e => setReversed(e.target.checked)} /><span>Permitir cartas invertidas nesta consulta</span></label>}
      {intake.safety_note && <p className="safety-note">{intake.safety_note}</p>}

      <div className="actions"><button className="button primary" onClick={draw} disabled={busy}>{busy ? "Preparando..." : "Preparar minha consulta"}</button><button className="button" onClick={() => setIntake(null)}>Editar pergunta</button></div>
      {message && <><p className="status-message">{message}</p>{message.includes("Crie sua conta") && <Link className="button" href="/auth/sign-up">Criar conta gratuita</Link>}</>}
    </main>;
  }

  return <main className="shell section consultation-page">
    <div className="eyebrow">Encontro com Lunah</div>
    <h1 className="page-title">O que trouxe você até aqui?</h1>
    <p className="lead">Você pode contar com suas próprias palavras. Não precisa saber exatamente como formular sua pergunta.</p>

    <div className="topic-grid">
      {topics.map(item => <button key={item} className={`topic-chip ${topic === item ? "active" : ""}`} onClick={() => setTopic(item)}>{item}</button>)}
    </div>

    <div className="consult-box">
      <label htmlFor="question" className="field-label">Conte para Lunah o que você gostaria de compreender.</label>
      <textarea id="question" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Conte o que está acontecendo, o que você sente ou qual situação deseja compreender melhor..." />
      <div className="actions"><button className="button primary" onClick={listen} disabled={busy || (!question.trim() && topic !== "Meu momento atual")}>{busy ? "Lunah está ouvindo..." : "Conversar com Lunah"}</button><Link className="button" href="/">Voltar</Link></div>
      <p className="hint">Sem cadastro. A sessão anônima é usada apenas para proteger e manter a continuidade desta primeira consulta.</p>
      {message && <p className="status-message">{message}</p>}
    </div>
  </main>;
}
