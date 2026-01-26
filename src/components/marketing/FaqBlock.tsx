"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const FAQ_ITEMS = [
  {
    id: "q1",
    question: "What are these tools designed to help with?",
    answer:
      "These tools are built to help you improve how content converts — not just how it performs. Each tool focuses on a specific decision point: how you open, what you ask people to do, how you frame ideas, and why engagement breaks down.",
  },
  {
    id: "q2",
    question: "Do I need to use all the tools, or can I use them individually?",
    answer:
      "You can use any tool on its own. However, they are designed to work best together. Most users start with the Hook Analyzer, then move to CTA Match or Caption Optimizer once the opening is clear.",
  },
  {
    id: "q3",
    question: "Why do some tools feel more analytical than others?",
    answer:
      "Some tools diagnose problems, others generate options. That’s intentional. Diagnosis comes first; generation comes after. This prevents surface-level fixes and helps you focus on what actually needs to change.",
  },
  {
    id: "q4",
    question: "Are the outputs generic, or based on my inputs?",
    answer:
      "Outputs are based directly on what you provide. The quality of the result depends on the clarity of your inputs. If something is missing, the tool will reflect lower confidence and suggest what to add.",
  },
  {
    id: "q5",
    question: "What’s the difference between the 7-day trial and Pro access?",
    answer:
      "The 7-day trial lets you test the core logic of each tool. Pro unlocks higher usage, saving results, exporting outputs, and deeper diagnostics. Nothing essential is hidden — Pro simply removes friction.",
  },
  {
    id: "q6",
    question: "Why am I sometimes blocked by tokens or cooldowns?",
    answer:
      "Limits exist to keep usage predictable and fair. Tokens reset daily, and cooldowns prevent low-signal runs. When you’re locked, the tool will always tell you why and what unlocks it.",
  },
  {
    id: "q7",
    question: "Can I save or export my results?",
    answer:
      "Saving, exporting, and PDF reports are available on Pro plans. This allows you to reuse insights, document decisions, or share outputs with a team.",
  },
  {
    id: "q8",
    question: "Are these tools meant for beginners or experienced creators?",
    answer:
      "They work for both. Beginners get structure and clarity. Experienced users use them to spot blind spots and tighten decisions faster.",
  },
  {
    id: "q9",
    question: "Will these tools tell me exactly what to post?",
    answer:
      "No. They’re designed to help you make better decisions, not replace judgment. The goal is clarity, not automation.",
  },
  {
    id: "q10",
    question: "How often should I use these tools?",
    answer:
      "Use them whenever something isn’t converting the way you expect. Many users run them before posting; others use them to diagnose underperforming content after the fact.",
  },
]

export function FaqBlock({ title = "FAQ" }: { title?: string }) {
  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-[#3a3a3a] p-6 shadow-[0_24px_40px_rgba(0,0,0,0.35)]">
      <div>
        <h2 className="text-lg font-semibold text-[hsl(var(--text))]">{title}</h2>
        <p className="text-sm text-[hsl(var(--muted))]">Clear answers to how the tools work and when to use them.</p>
      </div>
      <Accordion type="multiple" defaultValue={["q1", "q2"]} className="space-y-2">
        {FAQ_ITEMS.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="rounded-lg border border-white/10 bg-[#343434] px-4"
          >
            <AccordionTrigger className="text-sm font-medium">{item.question}</AccordionTrigger>
            <AccordionContent className="text-sm text-[hsl(var(--muted))]">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
