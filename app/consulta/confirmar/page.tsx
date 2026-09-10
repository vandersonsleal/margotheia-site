import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { startReading } from "../actions";

export default async function ConfirmarPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const cookieStore = await cookies();
  const raw = cookieStore.get("margotheia_intake")?.value;
  if (!raw) redirect("/consulta?erro=Sua+sessão+de+consulta+expirou");

  let stored: any;
  try { stored = JSON.parse(decodeURIComponent(raw!)); }
  catch { redirect("/consulta?erro=Não+foi+possível+recuperar+sua+consulta"); }

  const intake = stored.intake;
  const recommended = intake?.recommended_oracle === "petit-lenormand" ? "petit-lenormand" : "tarot-marseille";

  return (
    <main className="shell section consultation-page">
      <div className="eyebrow">Lunah compreendeu sua questão</div>
      <h1 className="page-title small">Antes das cartas, confirme sua consulta.</h1>

      <div className="lunah-response"><span>Lunah</span><p>{intake?.acknowledgement}</p></div>

      <div className="consult-summary">
        <div><small>Pergunta</small><strong>{intake?.refined_question || stored.question}</strong></div>
        <div><small>Tema</small><strong>{intake?.detected_topic || stored.topic || "Pergunta livre"}</strong></div>
        <div><small>Recomendação</small><strong>{intake?.recommendation_reason}</strong></div>
      </div>

      <form action={startReading} className="consult-box server-form">
        <fieldset className="topic-fieldset">
          <legend className="field-label">Escolha o oráculo</legend>
          <label className="oracle-option server-option">
            <input type="radio" name="oracle" value="tarot-marseille" defaultChecked={recommended === "tarot-marseille"} />
            <span><strong>Tarot de Marselha</strong><small>Arquétipos, processos internos e caminhos.</small></span>
          </label>
          <label className="oracle-option server-option">
            <input type="radio" name="oracle" value="petit-lenormand" defaultChecked={recommended === "petit-lenormand"} />
            <span><strong>Petit Lenormand</strong><small>Dinâmica concreta, acontecimentos e relações.</small></span>
          </label>
        </fieldset>

        <label className="checkline inversion-choice">
          <input type="checkbox" name="reversed_enabled" />
          <span>Permitir cartas invertidas se eu escolher Tarot de Marselha</span>
        </label>

        {intake?.safety_note && <p className="safety-note">{intake.safety_note}</p>}
        {erro && <p className="status-message error">{erro}</p>}

        <div className="actions">
          <button type="submit" className="button primary">Preparar minha consulta</button>
          <a className="button" href="/consulta">Editar pergunta</a>
        </div>
      </form>
    </main>
  );
}
