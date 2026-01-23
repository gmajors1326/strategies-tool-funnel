"use server"

import { generateStructuredOutput } from "@/src/lib/ai/openaiClient"
import type { ZodSchema } from "zod"

export type ToolAiResult<T> =
  | { ok: true; output: T; aiMeta: { model: string; requestId?: string; inputTokens?: number; outputTokens?: number } }
  | { ok: false; error: { errorCode: "AI_OUTPUT_INVALID"; message: string; toolId: string; requestId?: string } }

type RunToolAIArgs<T> = {
  toolId: string
  input: Record<string, any>
  schema: ZodSchema<T>
  jsonSchema?: Record<string, any>
  model: string
  temperature: number
  brief: string
}

export async function runToolAI<T>(args: RunToolAIArgs<T>): Promise<ToolAiResult<T>> {
  const system = [
    args.brief,
    "",
    "Grounding rules:",
    "- Every recommendation must reference a specific input field or a short quote from input.",
    "- Do not invent metrics, outcomes, or audience details beyond the input.",
    "- If a required input is missing, set confidence low and state the missing field.",
    "",
    "Output rules:",
    "- Return ONLY valid JSON that matches the schema.",
    "- No extra keys. No markdown. No backticks.",
    "- Include evidence: an array of short references to input fields or quotes.",
  ].join("\n")

  const user = [
    "User input (JSON):",
    JSON.stringify(args.input ?? {}, null, 2),
    "",
    "Required output schema:",
    JSON.stringify(args.jsonSchema ?? {}, null, 2),
  ].join("\n")

  const result = await generateStructuredOutput(
    {
      toolId: args.toolId,
      input: args.input,
      schema: args.schema,
      jsonSchema: args.jsonSchema,
      model: args.model,
      temperature: args.temperature,
      maxOutputTokens: 1400,
    },
    { system, user }
  )

  if ("error" in result) {
    return {
      ok: false,
      error: {
        errorCode: "AI_OUTPUT_INVALID",
        message: "Output could not be validated",
        toolId: args.toolId,
        requestId: undefined,
      },
    }
  }

  return {
    ok: true,
    output: result.output,
    aiMeta: {
      model: result.usage.model,
      requestId: result.usage.responseId,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
    },
  }
}
