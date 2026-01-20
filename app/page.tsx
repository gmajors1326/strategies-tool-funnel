'use client'

import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#7d9b76] text-foreground">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-28 md:pt-24 md:pb-36">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-[#d8ba8c] text-shadow-ink-40">
            The Strategy Tools
          </h1>
          <p className="text-xl md:text-2xl text-white mb-8 max-w-2xl mx-auto">
            Strategic engagement tools that turn conversations into revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="outline" className="border-border/60 hover:bg-accent/60 shadow-ink-40">
              <Link href="#faq">Learn More</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-white text-shadow-ink-40">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="following" className="bg-card/80 border-border/60 rounded-lg px-6">
              <AccordionTrigger className="text-card-foreground text-[15px]">Do I need a big following?</AccordionTrigger>
              <AccordionContent className="text-card-foreground text-[15px]">
                No. These tools work at any follower count. The Strategy is designed to help you build engagement regardless of your current size.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="automation" className="bg-card/80 border-border/60 rounded-lg px-6">
              <AccordionTrigger className="text-card-foreground text-[15px]">Is this automation? Will it risk my account?</AccordionTrigger>
              <AccordionContent className="text-card-foreground text-[15px]">
                No automation. These are strategic frameworks you implement manually. Everything is designed to work within Instagram&apos;s guidelines.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="time" className="bg-card/80 border-border/60 rounded-lg px-6">
              <AccordionTrigger className="text-card-foreground text-[17px]">How much time does this take per day?</AccordionTrigger>
              <AccordionContent className="text-card-foreground text-[15px]">
                The Strategy is designed for 15-30 minutes of focused engagement per day. The tools help you maximize impact in that time.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="services-vs-products" className="bg-card/80 border-border/60 rounded-lg px-6">
              <AccordionTrigger className="text-card-foreground text-[15px]">What if I&apos;m selling services vs digital products?</AccordionTrigger>
              <AccordionContent className="text-card-foreground text-[15px]">
                The tools adapt to your offer type. DM Engine includes templates for both service-based and product-based businesses.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white text-shadow-ink-40">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            All tools are free to use. Get started now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-cactus-primary text-white hover:opacity-90 shadow-ink-40">
              <Link href="#faq">Learn More →</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
