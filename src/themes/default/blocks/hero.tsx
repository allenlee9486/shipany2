import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

export function Hero({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const video = (section as any).video ?? {};

  return (
    <section
      id={section.id}
      className={cn('pt-28 pb-12 md:pt-40 md:pb-20', section.className, className)}
    >
      <div className="container grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div>
          {section.announcement && (
            <Link
              href={section.announcement.url || ''}
              target={section.announcement.target || '_self'}
              className="border-border inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-bold tracking-[0.18em] uppercase transition-colors hover:bg-muted"
            >
              <span className="bg-primary size-2" aria-hidden />
              {section.announcement.title}
            </Link>
          )}

          {section.label && (
            <p className="text-muted-foreground mt-6 text-xs font-bold tracking-[0.22em] uppercase">
              {section.label}
            </p>
          )}

          <h1 className="mt-3 break-words text-4xl leading-[0.95] font-display uppercase tracking-tight text-balance sm:text-6xl xl:text-7xl">
            {section.title}
          </h1>

          {section.description && (
            <p className="mt-6 max-w-xl text-lg leading-snug font-semibold text-balance">
              {section.description}
            </p>
          )}

          {section.tip && (
            <p className="text-muted-foreground mt-4 text-xs font-bold tracking-[0.18em] uppercase">
              {section.tip}
            </p>
          )}

          {section.buttons && section.buttons.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {section.buttons.map((button, idx) => (
                <Link
                  key={idx}
                  href={button.url ?? ''}
                  target={button.target ?? '_self'}
                  className={cn(
                    'inline-flex h-11 items-center justify-center gap-2 px-6 text-sm font-bold tracking-wide uppercase transition-colors',
                    button.variant === 'outline'
                      ? 'border-border hover:bg-muted border bg-transparent'
                      : 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground'
                  )}
                >
                  {button.icon && (
                    <SmartIcon name={button.icon as string} className="size-4" />
                  )}
                  <span>{button.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {video.src && (
          <div className="border-border relative border bg-black">
            <video
              className="aspect-video w-full object-cover"
              src={video.src}
              poster={video.poster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
            {video.caption && (
              <div className="border-border text-muted-foreground border-t px-4 py-2.5 text-xs font-bold tracking-[0.18em] uppercase">
                {video.caption}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
