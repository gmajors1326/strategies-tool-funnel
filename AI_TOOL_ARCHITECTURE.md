# AI Tool Architecture

## Overview

All tools in the Strategy Funnel app use a unified AI reasoning engine pattern. Every tool follows the same pipeline:

**Inputs → AI call → Strict JSON schema validation → UI renderer**

## Core Components

### 1. AI Client (`lib/ai/client.ts`)
- Wraps OpenAI (or other providers)
- Handles API calls with configurable temperature, max tokens
- Enforces JSON response format

### 2. Tool Runner (`lib/ai/runTool.ts`)
- Generic runner for all tools
- Validates outputs against Zod schemas
- Auto-retries with repair prompts on invalid JSON
- Returns safe fallback outputs on failure

### 3. Tool Registry (`lib/ai/toolRegistry.ts`)
- Maps `toolId` → tool configuration
- Defines input fields and output sections
- Single source of truth for tool metadata

### 4. Schemas (`lib/ai/schemas.ts`)
- Zod schemas for each tool's output
- Ensures type safety and validation
- All schemas include `confidence_level` and `evidence`

### 5. Prompts (`lib/ai/prompts.ts`)
- Tool-specific system prompts
- Combined with global system prompt
- Defines output requirements and constraints

### 6. UI Components
- `ToolShell`: Layout wrapper (inputs left, outputs right)
- `OutputSection`: Reusable output display with copy buttons
- `SaveToPlanButton`: Saves outputs to localStorage

## How to Add a New Tool (5 Steps)

### Step 1: Define the Schema
Add a Zod schema in `lib/ai/schemas.ts`:

```typescript
export const myNewToolSchema = baseOutputSchema.extend({
  // Your tool-specific fields
  recommendation: z.string(),
  reasons: z.array(z.string()),
  // ... more fields
})

// Add to toolSchemas object
export const toolSchemas = {
  // ... existing tools
  my_new_tool: myNewToolSchema,
} as const
```

### Step 2: Create the Prompt
Add a prompt in `lib/ai/prompts.ts`:

```typescript
export const toolPrompts: Record<ToolId, string> = {
  // ... existing prompts
  my_new_tool: `You are analyzing [context]...

INPUTS:
- field1: Description
- field2: Description

OUTPUT REQUIREMENTS:
- recommendation: What to recommend
- reasons: Why this recommendation
...
`,
}
```

### Step 3: Register the Tool
Add tool config in `lib/ai/toolRegistry.ts`:

```typescript
export const toolRegistry: Record<ToolId, ToolConfig> = {
  // ... existing tools
  my_new_tool: {
    toolId: 'my_new_tool',
    title: 'My New Tool',
    description: 'What this tool does',
    inputFields: [
      {
        key: 'field1',
        label: 'Field 1',
        type: 'text',
        required: true,
        placeholder: 'Enter...',
      },
      // ... more fields
    ],
    outputSections: [
      { key: 'recommendation', title: 'Recommendation', type: 'text', copyable: true },
      { key: 'reasons', title: 'Reasons', type: 'list', copyable: true },
      // ... more sections
    ],
  },
}
```

### Step 4: Create the Page
Create `app/tools/my-new-tool/page.tsx`:

```typescript
import { ToolShell } from '@/components/tools/ToolShell'
import { getToolConfig } from '@/lib/ai/toolRegistry'

export default function MyNewToolPage() {
  const config = getToolConfig('my_new_tool')
  return (
    <div className="min-h-screen bg-[#7d9b76] py-8">
      <ToolShell config={config} />
    </div>
  )
}
```

### Step 5: Add Fallback Output
Add fallback in `lib/ai/runTool.ts` `createFallbackOutput` function:

```typescript
case 'my_new_tool':
  return {
    ...base,
    recommendation: 'Insufficient signal',
    reasons: ['Need more data'],
    // ... other fields
  }
```

## Prompt/Schema Design Checklist

### ✅ Prompt Design
- [ ] Clear input descriptions (what each field means)
- [ ] Explicit output requirements (what each field should contain)
- [ ] Constraints and rules (what to avoid, what to prioritize)
- [ ] Examples or patterns (if helpful)
- [ ] Tone and style guidance

### ✅ Schema Design
- [ ] Includes `confidence_level` and `evidence` (from base schema)
- [ ] All required fields are marked as required
- [ ] Array lengths are constrained (min/max)
- [ ] String lengths are constrained (maxLength) where appropriate
- [ ] Enums are used for categorical values
- [ ] Nested objects are properly typed
- [ ] Optional fields are marked optional

### ✅ Output Section Types
- `text`: Single string value
- `list`: Array of strings (rendered as bullet list)
- `object`: Key-value pairs (rendered as labeled fields)
- `score`: Number 1-10 (rendered as score bar)

### ✅ Testing Checklist
- [ ] Tool runs without errors
- [ ] All required inputs are validated
- [ ] Output matches schema
- [ ] Copy buttons work for copyable sections
- [ ] Save to Plan works
- [ ] Fallback output displays correctly on failure
- [ ] Responsive layout works on mobile
- [ ] Error messages are clear

## Environment Variables

```env
# Required
AI_API_KEY="sk-..." # or OPENAI_API_KEY
AI_MODEL="gpt-4-turbo-preview"

# Optional
AI_PROVIDER="openai" # default: openai
AI_TEMPERATURE="0.2" # default: 0.2 (deterministic)
AI_MAX_TOKENS="800" # default: 800
```

## Architecture Benefits

1. **Consistency**: All tools follow the same pattern
2. **Type Safety**: Zod schemas ensure valid outputs
3. **Maintainability**: Single place to update AI logic
4. **Extensibility**: Easy to add new tools
5. **Reliability**: Auto-retry and fallback handling
6. **User Experience**: Unified UI across all tools

## Current Tools

- `post_types_to_outperform`: Map goals to post types
- `why_post_failed`: Diagnose post failures
- `hook_pressure_test`: Test hook effectiveness
- `retention_leak_finder`: Find retention issues
- `algorithm_training_mode`: Analyze algorithm signals
