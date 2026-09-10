"use client";

import Link from "next/link";
import { useState } from "react";

const topics = ["Amor & Relacionamentos","Trabalho & Carreira","Dinheiro & Prosperidade","Decisões & Caminhos","Família & Vínculos","Espiritualidade","Autoconhecimento","Meu momento atual"];

export default function Consulta() {
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState<string | null>(null);

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
      <div className="actions">
        <button className="button primary" disabled={!question.trim() && topic !== "Meu momento atual"}>Continuar com Lunah</button>
        <Link className="button" href="/">Voltar</Link>
      </div>
      <p className="hint">A próxima etapa conectará esta pergunta ao acolhimento inteligente de Lunah e à tiragem gratuita de três cartas.</p>
    </div>
  </main>;
}
