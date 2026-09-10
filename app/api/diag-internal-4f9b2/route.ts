import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

declare global { var __margotheiaDiag: Promise<Record<string, unknown>> | undefined; }

async function invokeEdge(name:string, token:string, body:unknown) {
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const response=await fetch(`${base}/functions/v1/${name}`, {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`,"apikey":key},
    body:JSON.stringify(body),
    cache:"no-store"
  });
  const raw=await response.text();
  let data:any;
  try{data=JSON.parse(raw)}catch{data={raw:raw.slice(0,600)}}
  return { response, data };
}

async function runDiagnostic(): Promise<Record<string, unknown>> {
  const supabase = await createClient();
  let readingId: string | null = null;
  try {
    const { data: auth, error: authError } = await supabase.auth.signInAnonymously({ options: { data: { source: "internal_health_diagnostic" } } });
    if (authError || !auth.session) return { ok:false, stage:"auth", detail:authError?.message ?? "no_session" };
    const token=auth.session.access_token;

    const question="Como posso lidar melhor com uma decisão profissional importante?";
    const intakeCall=await invokeEdge("lunah-intake",token,{question,topic:"Trabalho & Carreira"});
    const intake=intakeCall.data;
    if(!intakeCall.response.ok||intake?.error||!intake?.intake) return {ok:false,stage:"intake",status:intakeCall.response.status,error:intake?.error??null,code:intake?.code??null,detail:intake?.detail??intake?.raw??"unknown"};

    const oracle=intake.intake.recommended_oracle === "petit-lenormand" ? "petit-lenormand" : "tarot-marseille";
    const drawCall=await invokeEdge("start-free-reading",token,{question,refined_question:intake.intake.refined_question,topic:intake.intake.detected_topic,oracle,reversed_enabled:false});
    const draw=drawCall.data;
    if(draw?.reading_id) readingId=draw.reading_id;
    if(!drawCall.response.ok||draw?.error||!draw?.reading_id) return {ok:false,stage:"draw",status:drawCall.response.status,error:draw?.error??null,detail:draw?.detail??draw?.raw??"unknown"};

    const readingCall=await invokeEdge("lunah-reading",token,{reading_id:draw.reading_id,depth:"balanced"});
    const reading=readingCall.data;
    if(!readingCall.response.ok||reading?.error||!reading?.interpretation) return {ok:false,stage:"interpretation",status:readingCall.response.status,error:reading?.error??null,detail:reading?.detail??reading?.raw??"unknown",code:reading?.code??null,cards:Array.isArray(draw.cards)?draw.cards.map((c:{name:string})=>c.name):[]};

    return {ok:true,stage:"complete",model:reading.model??null,api:reading.api??null,prompt_version:reading.prompt_version??null,cards:Array.isArray(draw.cards)?draw.cards.map((c:{name:string})=>c.name):[],overview_chars:typeof reading.interpretation?.overview==="string"?reading.interpretation.overview.length:0};
  } catch(e) {
    return {ok:false,stage:"exception",detail:String(e).slice(0,600)};
  } finally {
    if (readingId) {
      await supabase.from("reading_messages").delete().eq("reading_id", readingId);
      await supabase.from("reading_interpretations").delete().eq("reading_id", readingId);
      await supabase.from("reading_analysis").delete().eq("reading_id", readingId);
      await supabase.from("reading_cards").delete().eq("reading_id", readingId);
      await supabase.from("readings").delete().eq("id", readingId);
    }
    await supabase.auth.signOut();
  }
}

export async function GET() {
  if (!globalThis.__margotheiaDiag) {
    globalThis.__margotheiaDiag = runDiagnostic().then((result)=>{
      console.log("MARGOTHEIA_DIAG", JSON.stringify(result));
      return result;
    });
  }
  const result=await globalThis.__margotheiaDiag;
  return NextResponse.json({health:"ok",diagnostic:result});
}
