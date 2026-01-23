"use server"

import { generateStructuredOutput } from "@/src/lib/ai/openaiClient"
import type { ZodSchema } from "zod"

export type ToolAiErrorCode = "AI_OUTPUT_INVALID" | "AI_RESPONSE_EMPTY" | "AI_RESPONSE_BAD_JSON" | "AI_PROVIDER_ERROR"

export type ToolAiResult<T> =
  | { ok: true; output: T; aiMeta: { model: string; requestId?: string; inputTokens?: number; outputTokens?: number } }
  | { ok: false; error: { errorCode: ToolAiErrorCode; message: string; toolId: string; requestId?: string } }

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
  const requiredFields = Array.isArray(args.jsonSchema?.required) ? args.jsonSchema?.required : []

  const system = [
    args.brief,
    "",
    "Grounding rules:",
    "- Every recommendation must reference a specific input field or a short quote from input.",
    "- Do not invent metrics, outcomes, or audience details beyond the input.",
    "- If a required input is missing, set confidence low and state the missing field.",
    "",
    requiredFields.length ? `Required top-level fields: ${requiredFields.join(", ")}` : null,
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
        errorCode: result.error.errorCode,
        message: result.error.message || "Output could not be validated",
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
