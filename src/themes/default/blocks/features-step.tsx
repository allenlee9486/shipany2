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
      className={cn('py-20 md:py-28', section.className, className)}
    >
      <div className="container">
        <ScrollAnimation>
          <div className="text-balance mx-auto max-w-3xl text-center">
            {section.label && (
              <p className="font-mono text-xs font-bold tracking-[0.35em] text-teal-400 uppercase">
                {section.label}
              </p>
            )}
            {section.title && (
              <h2 className="font-display text-[#f2ead9] mt-4 break-words text-4xl leading-[0.95] font-normal tracking-tight uppercase text-balance sm:text-5xl md:text-6xl">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="text-[#a89e8c] mx-auto mt-5 max-w-2xl text-base">
                {section.description}
              </p>
            )}
          </div>
        </ScrollAnimation>

        <ScrollAnimation delay={0.2}>
          <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-12 md:mt-20 md:grid-cols-3">
            {section.items?.map((item, idx) => (
              <div className="border-t border-[#8a744a]/50 pt-8" key={idx}>
                <span className="font-mono text-base text-[#e8a33d]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display text-[#f2ead9] mt-5 text-xl tracking-wide uppercase md:text-2xl">
                  {item.title}
                </h3>
                <p className="text-[#a89e8c] mt-3 text-[15px] leading-relaxed">
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
