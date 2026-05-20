import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Trata requisições de preflight CORS (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { bulletPoints } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "A chave GEMINI_API_KEY não está configurada no ambiente do Supabase." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!bulletPoints || bulletPoints.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Os bulletPoints são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Você é um assistente clínico de IA profissional para psicólogos terapeutas. 
Sua tarefa é transformar os bullet points / anotações rápidas e informais da sessão clínica feitas pelo psicólogo em uma evolução clínica formal, corrida, técnica e estruturada.
Ela deve seguir estritamente as regras de ética do Conselho Federal de Psicologia (CFP) e a abordagem da Terapia Cognitivo-Comportamental (TCC) se aplicável.
Mantenha um tom técnico, profissional, impessoal e focado na evolução clínica do paciente. Não use cabeçalhos ou divisões, faça em formato de texto corrido/parágrafo.

Anotações rápidas do psicólogo:
"${bulletPoints}"

Evolução Clínica estruturada:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const json = await response.json();
    const generatedText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error(json.error?.message || "Resposta vazia da API do Gemini.");
    }

    return new Response(
      JSON.stringify({ summary: generatedText.trim() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
