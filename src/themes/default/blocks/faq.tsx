'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { Section } from '@/shared/types/blocks/landing';

export function Faq({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  return (
    <section id={section.id} className={`py-16 md:py-24 ${className}`}>
      <div className="mx-auto max-w-full px-4 md:max-w-3xl md:px-8">
        <ScrollAnimation>
          <div className="max-w-2xl text-balance">
            {section.label && (
              <p className="text-muted-foreground text-xs font-bold tracking-[0.22em] uppercase">
                {section.label}
              </p>
            )}
            <h2 className="mt-3 break-words text-3xl leading-[0.95] font-display uppercase tracking-tight text-balance sm:text-4xl md:text-5xl">
              {section.title}
            </h2>
            {section.description && (
              <p className="text-muted-foreground mt-4 text-base font-medium">
                {section.description}
              </p>
            )}
          </div>
        </ScrollAnimation>

        <ScrollAnimation delay={0.2}>
          <div className="mt-10">
            <Accordion
              type="single"
              collapsible
              className="border-border w-full border"
            >
              {section.items?.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  value={item.question || item.title || ''}
                  className="border-b border-border last:border-b-0"
                >
                  <AccordionTrigger className="hover:bg-muted cursor-pointer px-5 py-4 text-sm font-bold tracking-[0.08em] uppercase hover:no-underline md:px-6">
                    {item.question || item.title || ''}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground px-5 pb-5 md:px-6">
                    {item.answer || item.description || ''}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {section.tip && (
              <p
                className="text-muted-foreground mt-6"
                dangerouslySetInnerHTML={{ __html: section.tip }}
              />
            )}
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}
