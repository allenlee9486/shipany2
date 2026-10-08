'use client';

import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

export function FeaturesStep({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  return (
    <section
      id={section.id}
      className={cn('py-16 md:py-24', section.className, className)}
    >
      <div className="container">
        <ScrollAnimation>
          <div className="max-w-3xl text-balance">
            {section.label && (
              <p className="text-muted-foreground text-xs font-bold tracking-[0.22em] uppercase">
                {section.label}
              </p>
            )}
            <h2 className="mt-3 break-words text-3xl leading-[0.95] font-display uppercase tracking-tight text-balance sm:text-4xl md:text-5xl">
              {section.title}
            </h2>
            {section.description && (
              <p className="text-muted-foreground mt-4 max-w-2xl text-base font-medium">
                {section.description}
              </p>
            )}
          </div>
        </ScrollAnimation>

        <ScrollAnimation delay={0.2}>
          <div className="border-border mt-12 grid grid-cols-1 divide-y divide-border border md:grid-cols-3 md:divide-x lg:grid-cols-5">
            {section.items?.map((item, idx) => (
              <div className="hover:bg-muted space-y-10 p-6 transition-colors md:p-7" key={idx}>
                <span className="text-primary block text-4xl font-display">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="space-y-2.5">
                  <h3 className="text-sm font-bold tracking-[0.12em] uppercase">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}
