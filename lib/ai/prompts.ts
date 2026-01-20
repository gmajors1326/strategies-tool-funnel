import { ToolId } from './schemas'

// NOTE: These are TOOL-SPECIFIC rules. Global rules are injected separately.

export const PROMPTS = {
  // 1
  why_post_failed: `
Diagnose why a post underperformed.

Choose EXACTLY ONE primary failure from this fixed list:
- "Hook failed to stop scroll"
- "Retention collapsed mid-post"
- "Idea wasn't sharp enough"
- "Too much explanation"
- "Wrong post type for the goal"
- "CTA mismatch"
- "Insufficient signal"

Rules:
- If any required field is missing/empty/invalid: do NOT guess. Return "Insufficient signal" with low confidence and name the missing inputs in evidence.
- Use bottleneck order: Hook → Retention → Idea clarity → CTA → Post type mismatch.
- Output exactly ONE fix (command style) and 2–3 do_not_change items.
Return JSON matching the schema.
`.trim(),

  // 2
  post_type_recommender: `
Select the SINGLE best post type to deploy next based on goal.

Choose EXACTLY ONE from:
- "Pattern-Breaker Posts"
- "Calm Insight Reels"
- "Nobody-Tells-You-This Posts"
- "Framework / Mental Model Posts"
- "Before/After Thinking Shifts"
- "Identity Alignment Posts"
- "Soft Direction Posts"
- "Insufficient signal"

Rules:
- If goal missing/invalid: "Insufficient signal" (low confidence).
- Hooks <= 12 words (5 examples).
- Captions 1–3 short lines (3 examples).
- CTAs soft, single action (3 examples).
Return JSON matching schema.
`.trim(),

  // 3
  hook_pressure_test: `
Pressure-test a hook in a 1–1.5 second window.

Return verdict: pass | borderline | fail | insufficient_signal.

Rules:
- If hook_text missing/empty: insufficient_signal (low confidence).
- Identify ONE strongest flaw and ONE fix.
- Provide exactly 2 rewrites each for curiosity/threat/status, <= 12 words, no filler.
- Provide 1 micro opening frame suggestion.
Return JSON matching schema.
`.trim(),

  // 4
  retention_leak_finder: `
Find the single biggest retention leak and prescribe ONE structural fix.

Choose EXACTLY ONE primary_leak from:
- "Opening frame mismatch"
- "Early pacing stall"
- "Mid-post value drop"
- "Over-explaining"
- "Visual stagnation"
- "Weak loop ending"
- "Insufficient signal"

Rules:
- If video_length_sec or avg_watch_time_sec missing/invalid: Insufficient signal (low confidence).
- cut_list must be exactly 3 specific cuts.
- loop_tweak must reference the opening frame and be subtle.
Return JSON matching schema.
`.trim(),

  // 5
  algorithm_training_mode: `
Design a short-term training sequence to teach the algorithm who this account is for.

Rules:
- If training_goal, target_audience, or core_topic missing/invalid: Insufficient signal (low confidence), empty sequence.
- Sequence length must match days (7/10/14).
- Each day includes post_type, purpose, success_metric, hook_template <= 12 words.
- Never mix multiple training goals.
Return JSON matching schema.
`.trim(),

  // 6
  cta_match_checker: `
Evaluate CTA alignment to post goal and audience temperature.

Rules:
- If post_goal or current_cta_text missing/invalid: Insufficient signal (low confidence).
- Verdict must be match | weak | mismatch | Insufficient signal.
- Choose ONE best_single_action: save|follow|dm|click|comment
- Provide exactly 5 rewritten CTAs <= 10 words.
- Provide 1 specific placement instruction.
Return JSON matching schema.
`.trim(),

  // 7
  follower_quality_filter: `
Sharpen positioning to attract the ideal follower and repel the wrong audience.

Rules:
- If ideal_follower_one_liner missing/empty: Insufficient signal (low confidence).
- Provide 8+ language_to_use and 8+ language_to_avoid.
- Provide exactly 3 post_types_to_attract and 3 post_types_to_repel.
Return JSON matching schema.
`.trim(),

  // 8
  content_system_builder: `
Build a repeatable weekly content system aligned to goal and capacity.

Rules:
- If primary_goal, posting_days_per_week, time_per_post, or niche missing/invalid: Insufficient signal (low confidence), empty weekly_plan/templates.
- weekly_plan length must equal posting_days_per_week.
- Templates per post_type: 3 hook templates (<=12 words) + 2 caption templates (short).
Return JSON matching schema.
`.trim(),

  // 9
  what_to_stop_posting: `
Identify dead-weight content patterns and replace them.

Rules:
- If recent_posts_summary missing/empty: return low confidence and instruct user to add at least 5 posts.
- Provide exactly 5 stop_list items when sufficient signal.
- keep_list exactly 3.
Return JSON matching schema.
`.trim(),

  // 10
  controlled_experiment_planner: `
Design a controlled experiment that changes ONE variable only.

Rules:
- If objective, baseline_description, duration_days, or posting_count missing/invalid: Insufficient signal (low confidence), empty test_matrix.
- test_matrix length must equal posting_count.
- keep_constant must list 4+ constants.
Return JSON matching schema.
`.trim(),

  // 11
  signal_vs_noise_analyzer: `
Assign metric weights (sum to 100) based on account stage and goal.

Rules:
- If account_stage or primary_goal missing: Insufficient signal (low confidence).
- Provide metric_weights whose weights sum to 100.
- Provide 3–5 ignore_list items.
- Provide 5 weekly_review_questions.
Return JSON matching schema.
`.trim(),

  // 12
  ai_hook_rewriter: `
Generate 12 hooks under strict constraints.

Rules:
- If topic or post_type missing: low confidence and empty hooks.
- Each hook <= max_words (default 12).
- Return best_3 as 0-based indices (3 items).
- Provide 3+ opening_frame_suggestions.
Return JSON matching schema.
`.trim(),

  // 13
  weekly_strategy_review: `
Review the week and return ONE pattern and ONE change.

Rules:
- If week_summary missing/empty: Insufficient signal (low confidence).
- keep_doing exactly 3, stop_doing exactly 2.
- next_week_plan exactly 5 slots; hook_prompt <= 12 words.
Return JSON matching schema.
`.trim(),

  // 14
  dm_intelligence_engine: `
Write ONE DM reply with strategic reasoning and risk awareness.

Rules:
- Output one recommended_reply only.
- No manipulation, guilt, pressure, or hype.
- Provide risk flags and avoid_saying to prevent unforced errors.
- Include ONE next-step question and one fallback follow-up.
Return JSON matching schema.
`.trim(),

  // 15
  hook_repurposer: `
Turn one hook into 10 materially different angles.

Rules:
- Exactly 10 hooks, each <= max_words.
- Provide angle_labels for each hook (10).
- Provide 3+ pattern_break_openers.
Return JSON matching schema.
`.trim(),

  // 16
  engagement_diagnostic_lite: `
Classify engagement into a tier and identify ONE primary bottleneck.

Rules:
- If key metrics missing: primary_bottleneck = insufficient_signal, low confidence.
- Provide one_actionable_insight (one sentence) and one_next_action (command).
Return JSON matching schema.
`.trim(),

  // 17
  dm_opener_generator_lite: `
Generate ONE DM opener based on scenario and tone.

Rules:
- Keep opener <= max_chars (default 240).
- Provide one follow-up message for seen/no reply.
Return JSON matching schema.
`.trim(),

  // 18
  offer_clarity_fixer_lite: `
Rewrite a fuzzy offer into a clear, believable promise with a simple path to yes.

Rules:
- If current_offer, target_customer, or main_problem missing/invalid: Insufficient signal (low confidence), name missing inputs in evidence.
- deliverables exactly 3, outcomes exactly 3.
- dm_pitch_lines exactly 5, each <= 140 chars.
- If proof_optional missing, do NOT invent proof. Reduce certainty instead.
Return JSON matching schema.
`.trim(),

  // 19
  landing_page_message_map_lite: `
Create a simple landing page message map for fast implementation.

Rules:
- If offer, audience, or primary_goal missing/invalid: Insufficient signal (low confidence), name missing inputs in evidence.
- benefit_bullets exactly 3, credibility_bullets exactly 3.
- If proof_optional missing, use neutral credibility (e.g., "Clear steps", "Simple process", "Fast turnaround").
- CTA must match primary_goal.
Return JSON matching schema.
`.trim(),

  // 20
  content_angle_miner_beginner: `
Convert one niche into a bank of practical, high-signal content angles.

Rules:
- If niche or content_goal missing/invalid: Insufficient signal (low confidence), name missing inputs in evidence.
- buckets exactly 3, angles per bucket exactly 4 (total 12).
- hook_template <= 12 words.
- suggested_post_type must be one of the listed options.
Return JSON matching schema.
`.trim(),
} as const

export function getToolPrompt(toolId: ToolId): string {
  return PROMPTS[toolId] || ''
}
