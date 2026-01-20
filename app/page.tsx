'use client'

import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AppCard } from '@/components/ui/AppCard'
import { ToolShell } from '@/components/tools/ToolShell'
import { getToolConfig } from '@/lib/ai/toolRegistry'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function HomePage() {
  const postTypeRecommenderConfig = getToolConfig('post_type_recommender')
  const hookPressureTestConfig = getToolConfig('hook_pressure_test')
  const retentionLeakFinderConfig = getToolConfig('retention_leak_finder')
  const algorithmTrainingModeConfig = getToolConfig('algorithm_training_mode')
  const followerQualityFilterConfig = getToolConfig('follower_quality_filter')
  const contentSystemBuilderConfig = getToolConfig('content_system_builder')
  const whatToStopPostingConfig = getToolConfig('what_to_stop_posting')
  const controlledExperimentPlannerConfig = getToolConfig('controlled_experiment_planner')
  const whyPostFailedConfig = getToolConfig('why_post_failed')

  return (
    <div className="min-h-screen bg-[#7d9b76] text-foreground">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-8 pb-12 md:pt-16 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 text-[#d8ba8c] text-shadow-ink-40">
            The Strategy Tools
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Strategic engagement tools that turn conversations into revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Button asChild size="lg" variant="outline" className="shadow-ink-40">
              <Link href="#tool">Try Tool</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="shadow-ink-40">
              <Link href="#faq">Learn More</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Tools Section */}
      <section id="tool" className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <ToolShell config={postTypeRecommenderConfig} />
          <ToolShell config={hookPressureTestConfig} />
          <ToolShell config={retentionLeakFinderConfig} />
          <ToolShell config={algorithmTrainingModeConfig} />
          <ToolShell config={followerQualityFilterConfig} />
          <ToolShell config={contentSystemBuilderConfig} />
          <ToolShell config={whatToStopPostingConfig} />
          <ToolShell config={controlledExperimentPlannerConfig} />
          <ToolShell config={whyPostFailedConfig} />
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-white text-shadow-ink-40">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            <AppCard>
              <AccordionItem value="following" className="border-0">
                <AccordionTrigger className="px-6 py-4">Do I need a big following?</AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  No. These tools work at any follower count. The Strategy is designed to help you build engagement regardless of your current size.
                </AccordionContent>
              </AccordionItem>
            </AppCard>
            <AppCard>
              <AccordionItem value="automation" className="border-0">
                <AccordionTrigger className="px-6 py-4">Is this automation? Will it risk my account?</AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  No automation. These are strategic frameworks you implement manually. Everything is designed to work within Instagram&apos;s guidelines.
                </AccordionContent>
              </AccordionItem>
            </AppCard>
            <AppCard>
              <AccordionItem value="time" className="border-0">
                <AccordionTrigger className="px-6 py-4">How much time does this take per day?</AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  The Strategy is designed for 15-30 minutes of focused engagement per day. The tools help you maximize impact in that time.
                </AccordionContent>
              </AccordionItem>
            </AppCard>
            <AppCard>
              <AccordionItem value="services-vs-products" className="border-0">
                <AccordionTrigger className="px-6 py-4">What if I&apos;m selling services vs digital products?</AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  The tools adapt to your offer type. DM Engine includes templates for both service-based and product-based businesses.
                </AccordionContent>
              </AccordionItem>
            </AppCard>
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white text-shadow-ink-40">Ready to Get Started?</h2>
          <p className="text-xl text-[hsl(var(--muted))] mb-8">
            All tools are free to use. Get started now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="shadow-ink-40">
              <Link href="#faq">Learn More →</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
