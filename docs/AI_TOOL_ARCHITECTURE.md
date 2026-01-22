# AI Tool Architecture

## Overview
Tools use a single, canonical registry and a single OpenAI runner pipeline:

**Registry (fields + caps) → Tool Runner UI → /api/tools/run → OpenAI Structured Outputs**

## Core Components

### 1) OpenAI Client
`src/lib/ai/openaiClient.ts`
- Creates a single OpenAI client
- Selects model per tool (`OPENAI_MODEL_LIGHT` / `OPENAI_MODEL_HEAVY`)
- Provides a stable safety identifier

### 2) Tool Registry (Single Source of Truth)
`src/lib/tools/registry.ts`
- Canonical list of 20 tool IDs (`EXPECTED_TOOL_IDS`)
- All tool metadata: name, description, category, caps, fields
- Fails fast if IDs mismatch or are duplicated

### 3) Tool Runner (OpenAI Structured Outputs)
`src/lib/tools/runnerRegistry.ts`
- Zod schemas for each tool output
- `TOOL_SPECS` keyed by toolId
- Hard error if specs don’t match `EXPECTED_TOOL_IDS`

### 4) API Route
`app/api/tools/run/route.ts`
- Validates usage caps and tokens
- Calls runner by `toolId`
- Persists runs and metering

### 5) UI Runner
`src/components/tools/ToolRunner.tsx`
- Renders inputs from registry fields
- Posts `{ toolId, mode, trialMode?, input }`

## How to Add a New Tool

1. **Add the tool ID** to `EXPECTED_TOOL_IDS` in `src/lib/tools/registry.ts`
2. **Create the ToolMeta** entry in `TOOL_REGISTRY` with `fields`, caps, and AI level
3. **Add a ToolSpec** in `src/lib/tools/runnerRegistry.ts` with a Zod schema + prompt
4. **Confirm alignment** (app fails fast if anything is missing or extra)

## Environment Variables

```env
OPENAI_API_KEY="sk-..."
OPENAI_MODEL_LIGHT="gpt-5.2"
OPENAI_MODEL_HEAVY="gpt-5.2"
```

## Notes
- Do not duplicate tool IDs anywhere else.
- Cards, Explore, and the Runner UI read from the registry only.
