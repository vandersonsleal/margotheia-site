import Link from "next/link";
import { listenWithLunah } from "./actions";

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

export default async function ConsultaPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <main className="shell section consultation-page">
      <div className="eyebrow">Encontro com Lunah · Beta 0.3</div>
      <h1 className="page-title">O que trouxe você até aqui?</h1>
      <p className="lead">Você pode contar com suas próprias palavras. Lunah escuta antes de revelar.</p>

      <form action={listenWithLunah} className="consult-box server-form">
        <fieldset className="topic-fieldset">
          <legend className="field-label">Se quiser, escolha o tema mais próximo da sua questão.</legend>
          <div className="topic-grid">
            {topics.map((item) => (
              <label className="topic-radio" key={item}>
                <input type="radio" name="topic" value={item} />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label htmlFor="question" className="field-label">Conte para Lunah o que você gostaria de compreender.</label>
        <textarea name="question" id="question" placeholder="Conte o que está acontecendo ou qual situação deseja compreender melhor..." />

        <div className="actions">
          <button type="submit" className="button primary">Conversar com Lunah</button>
          <Link className="button" href="/">Voltar</Link>
        </div>

        <p className="hint">Sem cadastro para a primeira consulta. Esta etapa funciona pelo servidor, mesmo sem JavaScript no navegador.</p>
        {erro && <p className="status-message error">{erro}</p>}
      </form>
    </main>
  );
}
