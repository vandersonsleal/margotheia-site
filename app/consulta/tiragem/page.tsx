import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { interpretReading } from "../actions";

export default async function TiragemPage({ searchParams }: { searchParams: Promise<{ reading?: string; erro?: string }> }) {
  const { reading, erro } = await searchParams;
  if (!reading) redirect("/consulta?erro=Leitura+não+encontrada");

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("reading_cards")
    .select("draw_order,is_reversed,cards(name,slug),spread_positions(name)")
    .eq("reading_id", reading)
    .order("draw_order", { ascending: true });

  if (error || !rows?.length) redirect("/consulta?erro=Não+foi+possível+carregar+as+cartas");

  return (
    <main className="shell section consultation-page zone">
      <div className="eyebrow">Zona Oracular</div>
      <h1 className="page-title small">As cartas estão sobre a mesa.</h1>

      <div className="spread-cards">
        {rows.map((row: any) => (
          <article className="oracle-card" key={row.draw_order}>
            <span>{row.spread_positions?.name || `Posição ${row.draw_order}`}</span>
            <strong>{row.cards?.name || "Carta"}</strong>
            {row.is_reversed && <em>Invertida</em>}
          </article>
        ))}
      </div>

      <p className="lead">Agora podemos olhar para a leitura como um todo.</p>
      {erro && <p className="status-message error">{erro}</p>}

      <form action={interpretReading}>
        <input type="hidden" name="reading_id" value={reading} />
        <button type="submit" className="button primary">Interpretar minha tiragem</button>
      </form>
    </main>
  );
}
