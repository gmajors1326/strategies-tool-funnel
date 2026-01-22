'use client'

import { useState, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AppCard } from '@/components/ui/AppCard'
import { ToolSearch } from '@/components/tools/ToolSearch'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { listTools } from '@/src/lib/tools/registry'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const allTools = useMemo(() => listTools(), [])
  const categoryOrder = useMemo(
    () => ['Hooks', 'Content', 'DMs', 'Offers', 'Analytics', 'Audience', 'Competitive'],
    []
  )
  const categories = useMemo(
    () => categoryOrder.filter((category) => allTools.some((tool) => tool.category === category)),
    [allTools, categoryOrder]
  )
  const onboardingChoices = useMemo(
    () => [
      { label: 'Write better hooks', category: 'Hooks' },
      { label: 'Create content faster', category: 'Content' },
      { label: 'Close DMs', category: 'DMs' },
      { label: 'Fix low engagement', category: 'Analytics' },
    ],
    []
  )
  const pricingNotes = useMemo(
    () => [
      'All Analytics tools are Pro+.',
      'DM tools cost more tokens (higher intensity).',
      'Beginner users start in Hooks + Content.',
    ],
    []
  )
  
  // Filter tools based on search query and category
  const baseFilteredTools = useMemo(() => {
    let filtered = allTools

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((tool) => tool.category === selectedCategory)
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter((tool) => tool.difficulty === selectedDifficulty)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((tool) => {
        const titleMatch = tool.name.toLowerCase().includes(query)
        const descMatch = tool.description.toLowerCase().includes(query)
        return titleMatch || descMatch
      })
    }
    
    return filtered
  }, [searchQuery, selectedCategory, selectedDifficulty, allTools])

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    baseFilteredTools.forEach((tool) => tool.tags?.forEach((tag) => tagSet.add(tag)))
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
  }, [baseFilteredTools])

  const filteredTools = useMemo(() => {
    if (selectedTags.length === 0) return baseFilteredTools
    return baseFilteredTools.filter((tool) => selectedTags.some((tag) => tool.tags?.includes(tag)))
  }, [baseFilteredTools, selectedTags])

  const sortedTools = useMemo(() => {
    const rank: Record<string, number> = { easy: 0, medium: 1, hard: 2 }
    return [...filteredTools].sort((a, b) => {
      const diff = (rank[a.difficulty] ?? 99) - (rank[b.difficulty] ?? 99)
      if (diff !== 0) return diff
      return a.name.localeCompare(b.name)
    })
  }, [filteredTools])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((value) => value !== tag) : [...prev, tag]
    )
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedDifficulty('all')
    setSelectedTags([])
  }
  

  return (
    <div className="min-h-screen bg-[#7d9b76] text-foreground">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-6 pb-12 md:pt-12 md:pb-20">
        <div className="flex justify-end no-print">
          <Button asChild size="sm" variant="outline" className="shadow-ink-40">
            <Link href="/admin/login">Admin</Link>
          </Button>
        </div>
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
        <div className="max-w-7xl mx-auto">
          <div className="no-print">
            <ToolSearch 
              searchQuery={searchQuery} 
              onSearchChange={setSearchQuery}
              inputRef={searchInputRef}
            />
          </div>
          
          <div className="mt-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 no-print">
            <p className="text-xs uppercase text-[hsl(var(--muted))] mb-3">What do you want help with?</p>
            <div className="flex flex-wrap gap-2">
              {onboardingChoices.map((choice) => (
                <Button
                  key={choice.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(choice.category)
                    setSelectedDifficulty('easy')
                    setSelectedTags([])
                    setSearchQuery('')
                  }}
                >
                  {choice.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 no-print">
            <p className="text-xs uppercase text-[hsl(var(--muted))] mb-3">Pricing & positioning clarity</p>
            <ul className="space-y-1 text-xs text-[hsl(var(--muted))]">
              {pricingNotes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          </div>
          
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8 no-print">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 no-print">
              <TabsTrigger value="all">All Tools</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="mb-6 grid gap-4 md:grid-cols-[220px_1fr] no-print">
            <div>
              <p className="text-xs uppercase text-[hsl(var(--muted))] mb-2">Difficulty</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'easy', label: 'Beginner' },
                  { value: 'medium', label: 'Intermediate' },
                  { value: 'hard', label: 'Advanced' },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={selectedDifficulty === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDifficulty(option.value as typeof selectedDifficulty)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase text-[hsl(var(--muted))] mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1 text-xs ${
                      selectedTags.includes(tag)
                        ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                        : 'bg-[hsl(var(--surface-3))] text-[hsl(var(--muted))] hover:bg-[hsl(var(--surface-4))]'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
                {availableTags.length === 0 && (
                  <span className="text-xs text-[hsl(var(--muted))]">No tags for this filter set.</span>
                )}
              </div>
            </div>
          </div>

          {filteredTools.length === 0 ? (
            <div className="text-center py-12 no-print">
              <p className="text-lg text-[hsl(var(--muted))]">
                {searchQuery 
                  ? `No tools found matching "${searchQuery}"`
                  : `No tools in "${selectedCategory === 'all' ? 'this category' : selectedCategory}".`}
              </p>
              <div className="flex gap-2 justify-center mt-4">
                {searchQuery && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear Search
                  </Button>
                )}
                {(selectedCategory !== 'all' || selectedDifficulty !== 'all' || selectedTags.length > 0) && (
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedTools.map((tool) => (
                <ErrorBoundary key={tool.id}>
                  <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-5 space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{tool.name}</p>
                      <p className="text-xs text-[hsl(var(--muted))]">{tool.description}</p>
                    </div>
                    <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--muted))]">
                      {tool.category} ·{' '}
                      {tool.aiLevel === 'none' ? 'No AI' : tool.aiLevel === 'light' ? 'Light AI' : 'Heavy AI'}
                    </div>
                    <div className="flex items-center justify-between text-xs text-[hsl(var(--muted))]">
                      <span>{tool.tokensPerRun} tokens/run</span>
                      <span>
                        {tool.category === 'Analytics' || tool.category === 'Competitive' ? 'Pro+' : 'Free'} ·{' '}
                        {tool.difficulty === 'easy' ? 'Beginner' : tool.difficulty === 'medium' ? 'Intermediate' : 'Advanced'}
                      </span>
                    </div>
                    <Link href={`/app/tools/${tool.id}`} className="block">
                      <Button className="w-full">Open tool</Button>
                    </Link>
                  </div>
                </ErrorBoundary>
              ))}
            </div>
          )}
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
