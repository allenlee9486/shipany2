'use client';

import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

// tone: "dark" = ink band, "gold" = amber band, default = cream
export function Cta({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const tone = (section as any).tone ?? 'light';

  const tones = {
    light: {
      section: 'border-y border-border',
      title: '',
      description: 'text-muted-foreground',
      chip: 'border-border text-muted-foreground',
      primary:
        'bg-foreground text-background hover:bg-primary hover:text-primary-foreground',
      secondary: 'border-border hover:bg-muted border bg-transparent',
    },
    dark: {
      section: 'bg-foreground text-background',
      title: '',
      description: 'text-background/70',
      chip: 'border-background/40 text-background/80',
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary:
        'border-background/40 text-background hover:bg-background/10 border bg-transparent',
    },
    gold: {
      section: 'bg-primary text-primary-foreground border-y border-border',
      title: '',
      description: 'text-primary-foreground/80',
      chip: 'border-primary-foreground/50',
      primary: 'bg-foreground text-background hover:opacity-90',
      secondary:
        'border-primary-foreground/60 hover:bg-primary-foreground/10 border bg-transparent',
    },
  } as const;

  const t = tones[(tone as keyof typeof tones) ?? 'light'] ?? tones.light;
  const items: string[] = ((section as any).items ?? []) as string[];

  return (
    <section
      id={section.id}
      className={cn('py-16 md:py-28', t.section, section.className, className)}
    >
      <div className="container">
        <div className="max-w-3xl">
          <ScrollAnimation>
            {section.label && (
              <p className="text-xs font-bold tracking-[0.22em] uppercase opacity-70">
                {section.label}
              </p>
            )}
            <h2
              className={cn(
                'mt-3 break-words text-4xl leading-[0.95] font-display uppercase tracking-tight text-balance sm:text-5xl md:text-6xl',
                t.title
              )}
            >
              {section.title}
            </h2>
          </ScrollAnimation>
          <ScrollAnimation delay={0.15}>
            <p
              className={cn('mt-4 max-w-xl text-base font-medium', t.description)}
              dangerouslySetInnerHTML={{ __html: section.description ?? '' }}
            />
          </ScrollAnimation>

          {items.length > 0 && (
            <ScrollAnimation delay={0.2}>
              <div className="mt-6 flex flex-wrap gap-2">
                {items.map((item, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      'border px-3 py-1.5 text-xs font-bold tracking-[0.14em] uppercase',
                      t.chip
                    )}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </ScrollAnimation>
          )}

          <ScrollAnimation delay={0.3}>
            <div className="mt-10 flex flex-wrap gap-4">
              {section.buttons?.map((button, idx) => (
                <Link
                  key={idx}
                  href={button.url || ''}
                  target={button.target || '_self'}
                  className={cn(
                    'inline-flex h-11 items-center justify-center gap-2 px-6 text-sm font-bold tracking-wide uppercase transition-colors',
                    button.variant === 'outline' ? t.secondary : t.primary
                  )}
                >
                  {button.icon && (
                    <SmartIcon name={button.icon as string} className="size-4" />
                  )}
                  <span>{button.title}</span>
                </Link>
              ))}
            </div>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  );
}
