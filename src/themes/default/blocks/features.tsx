'use client';

import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

export function Features({
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
      <div className="container space-y-8 md:space-y-14">
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
          <div className="border-border relative mx-auto grid grid-cols-1 divide-y divide-border border sm:grid-cols-2 sm:divide-x lg:grid-cols-3">
            {section.items?.map((item, idx) => (
              <div
                className="hover:bg-muted space-y-3 p-6 transition-colors md:p-8"
                key={idx}
              >
                <div className="flex items-center gap-2.5">
                  <SmartIcon
                    name={item.icon as string}
                    size={20}
                    className="text-primary shrink-0"
                  />
                  <h3 className="text-sm font-bold tracking-[0.12em] uppercase">
                    {item.title}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}
