# AI Engine Implementation Summary

## Current Architecture

1. **`src/lib/ai/openaiClient.ts`**
   - OpenAI client + model selection
   - `OPENAI_MODEL_LIGHT` / `OPENAI_MODEL_HEAVY`

2. **`src/lib/tools/registry.ts`**
   - Canonical tool IDs + fields + caps
   - Fails fast on missing/extra IDs

3. **`src/lib/tools/runnerRegistry.ts`**
   - Tool specs (Zod schemas + prompts)
   - Structured Outputs via `openai.responses.parse`
   - Hard alignment with registry IDs

4. **`app/api/tools/run/route.ts`**
   - Usage checks, token checks, trial/bonus logic
   - Logs metering and persists recent runs

5. **`src/components/tools/ToolRunner.tsx`**
   - Schema‑driven input UI based on registry fields
   - Posts `{ toolId, mode, trialMode?, input }` to `/api/tools/run`

## Adding a Tool

1. Add the tool ID to `EXPECTED_TOOL_IDS` in `src/lib/tools/registry.ts`
2. Add the tool’s `ToolMeta` entry (fields + caps + category)
3. Add a matching `ToolSpec` in `src/lib/tools/runnerRegistry.ts`
4. Run the app — it will fail fast if any IDs are missing or extra

## Environment Variables

```env
OPENAI_API_KEY="sk-..."
OPENAI_MODEL_LIGHT="gpt-5.2"
OPENAI_MODEL_HEAVY="gpt-5.2"
```
