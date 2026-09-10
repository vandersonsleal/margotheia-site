import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ResultadoPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("margotheia_result")?.value;
  if (!raw) redirect("/consulta?erro=Resultado+não+encontrado");

  let interpretation: any;
  try { interpretation = JSON.parse(decodeURIComponent(raw)); }
  catch { redirect("/consulta?erro=Não+foi+possível+carregar+o+resultado"); }

  return (
    <main className="shell section consultation-page result-page">
      <div className="eyebrow">Sua leitura com Lunah</div>
      <h1 className="page-title small">O centro da sua leitura</h1>

      {interpretation.overview && <section className="reading-section"><h2>O que esta tiragem revela primeiro</h2><p>{interpretation.overview}</p></section>}

      {!!interpretation.positions?.length && (
        <section className="reading-section">
          <h2>Leitura das posições</h2>
          <div className="reading-grid">
            {interpretation.positions.map((p: any, i: number) => (
              <article className="reading-card" key={i}>
                <span>{p.position_name}</span>
                <h3>{p.card_name}</h3>
                <p>{p.interpretation}</p>
                {p.central_symbol && <small>Símbolo central: {p.central_symbol}</small>}
              </article>
            ))}
          </div>
        </section>
      )}

      {interpretation.relationships && <section className="reading-section"><h2>Como essas cartas conversam entre si</h2><p>{interpretation.relationships}</p></section>}
      {interpretation.patterns && <section className="reading-section"><h2>Padrões desta tiragem</h2><p>{interpretation.patterns}</p></section>}
      {interpretation.synthesis && <section className="reading-section"><h2>O centro da sua leitura</h2><p>{interpretation.synthesis}</p></section>}
      {interpretation.guidance && <section className="reading-section emphasis"><h2>O que merece sua atenção agora</h2><p>{interpretation.guidance}</p></section>}

      <div className="actions">
        <Link className="button primary" href="/auth/sign-up">Criar conta e salvar minha jornada</Link>
        <Link className="button" href="/consulta">Nova consulta</Link>
      </div>

      <p className="hint">As cartas são uma ferramenta simbólica e reflexiva. A leitura não substitui orientação médica, jurídica, financeira ou de outros profissionais qualificados.</p>
    </main>
  );
}
