import { ToolId } from './ai/schemas'

export const inputExamples: Record<ToolId, Record<string, any>> = {
  why_post_failed: {
    post_type: 'Pattern-Breaker',
    primary_goal: 'Reach',
    views: 5000,
    avg_watch_time_sec: 3,
    saves: 20,
    profile_visits: 15,
    hook_felt_strong: 'true',
    looped_cleanly: 'true',
    one_clear_idea: 'false',
    calm_delivery: 'true',
    single_cta: 'true',
  },
  hook_pressure_test: {
    hook_text: 'The #1 mistake coaches make on Instagram',
    post_type_optional: 'Pattern-Breaker',
    tone_optional: 'calm',
  },
  retention_leak_finder: {
    video_length_sec: 30,
    avg_watch_time_sec: 8,
    retention_points_optional: '1s → 80%, 3s → 60%, 5s → 40%',
  },
  algorithm_training_mode: {
    training_goal: 'audience',
    target_audience: 'Fitness coaches who want to scale',
    core_topic: 'Lead generation without burnout',
    preferred_format: 'reels_only',
    days: '7',
    posting_capacity: 'medium',
  },
  post_type_recommender: {
    goal: 'reach_discovery',
    account_stage_optional: 'growing',
    niche_optional: 'SaaS founders',
  },
  cta_match_checker: {
    post_goal: 'saves',
    current_cta_text: 'Save this post for later',
    audience_temperature_optional: 'warm',
  },
  follower_quality_filter: {
    ideal_follower_one_liner: 'Fitness coaches who want to scale without burnout',
    niche_optional: 'Fitness coaching',
  },
  content_system_builder: {
    primary_goal: 'authority',
    posting_days_per_week: '3',
    time_per_post: 'medium',
    niche: 'SaaS founders',
  },
  what_to_stop_posting: {
    recent_posts_summary: 'Pattern-Breaker — Reach — low views\nFramework — Saves — lots of saves\nCalm Insight — Retention — drop at 3 seconds',
  },
  controlled_experiment_planner: {
    objective: 'increase_retention',
    baseline_description: 'Reels get 10k views, 5% retention, 0 DMs',
    duration_days: '7',
    posting_count: 5,
  },
  signal_vs_noise_analyzer: {
    account_stage: 'growing',
    primary_goal: 'dms',
    metrics_available: 'views,watch_time,retention,saves,profile_visits,follows,dms',
  },
  ai_hook_rewriter: {
    topic: 'Scaling a SaaS business',
    post_type: 'Pattern-Breaker',
    target_emotion: 'curiosity',
    max_words: 12,
  },
  weekly_strategy_review: {
    week_summary: 'Post 1: Pattern-Breaker — Reach — 5k views\nPost 2: Framework — Saves — 200 saves\nPost 3: Calm Insight — Retention — 8% retention',
    biggest_question: 'Why are saves high but DMs low?',
    time_available_next_week: 'medium',
  },
  dm_intelligence_engine: {
    platform: 'instagram',
    relationship_stage: 'warm',
    goal: 'Qualify for discovery call',
    last_incoming_message: 'This looks interesting, tell me more',
    tone: 'calm',
    compliance_sensitivity: 'medium',
  },
  hook_repurposer: {
    original_hook: 'The #1 mistake coaches make on Instagram',
    max_words: 12,
    tone: 'calm',
  },
  engagement_diagnostic_lite: {
    followers: 5000,
    avg_reel_views: 1000,
    avg_watch_time_sec_optional: 8,
    posts_per_week: 5,
    primary_format: 'reels',
    goal: 'dms',
  },
  dm_opener_generator_lite: {
    purpose: 'sales',
    context: 'Reaching out to a SaaS founder who commented on my post about scaling',
    what_you_want: 'Schedule a discovery call',
    tone: 'calm',
  },
  offer_clarity_fixer_lite: {
    current_offer: 'I help coaches scale their Instagram',
    target_customer: 'New digital marketers',
    main_problem: 'Struggling to get consistent DMs',
  },
  landing_page_message_map_lite: {
    offer: 'Instagram Strategy Course',
    audience: 'New digital marketers',
    primary_goal: 'sales',
    objection_optional: 'Too expensive',
  },
  content_angle_miner_beginner: {
    niche: 'Fitness coaching',
    content_goal: 'saves',
    audience_stage_optional: 'warm',
  },
}
