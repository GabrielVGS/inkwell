import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { headers } from "next/headers";

import { getAnalysisModel } from "@/lib/ai/llm";
import { auth } from "@/lib/auth";
import { getWritingContext } from "@/lib/db/queries";
import { WRITING_SUGGESTIONS_PROMPT } from "@/lib/prompts";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const context = await getWritingContext(session.user.id);

    const model = getAnalysisModel();

    let contextText = "";
    if (context.totalEntries === 0) {
      contextText = "O usuário é novo e ainda não escreveu nenhuma entrada.";
    } else {
      contextText = `Contexto do usuário:
- Total de entradas: ${context.totalEntries}
- Dias desde a última entrada: ${context.daysSinceLastEntry}
- Temas recorrentes: ${context.recentTags.join(", ") || "nenhum ainda"}
- Humores frequentes: ${context.commonMoods.join(", ") || "não analisado"}`;
    }

    const response = await model.invoke([
      new SystemMessage(WRITING_SUGGESTIONS_PROMPT),
      new HumanMessage(contextText),
    ]);

    const text = typeof response.content === "string" ? response.content : "";

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found");
      const suggestions = JSON.parse(jsonMatch[0]);
      return Response.json(suggestions);
    } catch {
      return Response.json([
        {
          title: "Como foi seu dia hoje?",
          description: "Escreva livremente sobre os momentos que marcaram o dia.",
        },
        {
          title: "Algo pelo qual sou grato",
          description: "Reflita sobre algo positivo, por menor que seja.",
        },
        {
          title: "O que está na minha mente",
          description: "Coloque no papel os pensamentos que estão ocupando espaço.",
        },
      ]);
    }
  } catch (error) {
    console.error("Writing suggestions error:", error);
    return Response.json([
      {
        title: "Como foi seu dia hoje?",
        description: "Escreva livremente sobre os momentos que marcaram o dia.",
      },
      {
        title: "Algo pelo qual sou grato",
        description: "Reflita sobre algo positivo, por menor que seja.",
      },
      {
        title: "O que está na minha mente",
        description: "Coloque no papel os pensamentos que estão ocupando espaço.",
      },
    ]);
  }
}
