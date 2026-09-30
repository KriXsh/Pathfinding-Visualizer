'use client';

import {useEffect, useId, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {Check, ChevronDown} from 'lucide-react';
import {cn} from '@/lib/utils';

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
  badges?: string[];
};

/** Glass dropdown. With `value` it's a select; without, an action menu. */
export function GlassSelect<T extends string>({
  label,
  icon,
  value,
  placeholder,
  options,
  onChange,
  disabled,
  className,
}: {
  label: string;
  icon?: React.ReactNode;
  value?: T;
  placeholder?: string;
  options: SelectOption<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const current = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const show = () => {
    setActive(
      Math.max(
        0,
        options.findIndex(o => o.value === value),
      ),
    );
    setOpen(true);
  };

  const choose = (v: T) => {
    onChange(v);
    setOpen(false);
    button.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(a => (a + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(a => (a - 1 + options.length) % options.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(options[active].value);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={root} className={cn('relative', className)} onKeyDown={onKeyDown}>
      <button
        ref={button}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${current?.label ?? placeholder}`}
        onClick={() => (open ? setOpen(false) : show())}
        className={cn(
          'group flex h-10 w-full items-center gap-2.5 rounded-xl border border-border bg-ink/[0.03] px-3 text-left text-sm font-medium text-foreground transition-all',
          'hover:border-primary/40 hover:bg-primary/[0.06] disabled:pointer-events-none disabled:opacity-45',
          open &&
            'border-primary/50 bg-primary/[0.08] shadow-[0_0_0_4px_rgb(99_102_241/0.12)]',
        )}
      >
        {icon && <span className="text-primary">{icon}</span>}
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            {label}
          </span>
          <span className="truncate">{current?.label ?? placeholder}</span>
        </span>
        <motion.span
          animate={{rotate: open ? 180 : 0}}
          transition={{type: 'spring', stiffness: 300, damping: 20}}
        >
          <ChevronDown aria-hidden className="size-4 text-muted-foreground" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label={label}
            aria-activedescendant={`${listId}-${active}`}
            initial={{opacity: 0, y: -6, scale: 0.97}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: -6, scale: 0.97}}
            transition={{duration: 0.18, ease: [0.16, 1, 0.3, 1]}}
            style={{transformOrigin: 'top'}}
            className="absolute top-[calc(100%+8px)] left-0 z-50 w-full min-w-64 overflow-hidden rounded-2xl border border-border-strong bg-pf-panel/90 p-1.5 shadow-[0_24px_60px_-20px_var(--color-shadow)] backdrop-blur-2xl"
          >
            {options.map((o, k) => {
              const selected = o.value === value;
              return (
                <li
                  key={o.value}
                  id={`${listId}-${k}`}
                  role="option"
                  aria-selected={selected}
                  onPointerEnter={() => setActive(k)}
                  onClick={() => choose(o.value)}
                  className={cn(
                    'relative flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition-colors',
                    k === active && 'bg-primary/10',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-foreground">
                      {o.label}
                      {o.badges?.map(b => (
                        <span
                          key={b}
                          className="rounded-md border border-border px-1.5 py-px font-mono text-[9.5px] font-medium tracking-wider text-muted-foreground uppercase"
                        >
                          {b}
                        </span>
                      ))}
                    </span>
                    {o.hint && (
                      <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                        {o.hint}
                      </span>
                    )}
                  </span>
                  {selected && (
                    <Check
                      aria-hidden
                      className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
