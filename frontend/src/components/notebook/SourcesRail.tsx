import { motion } from "motion/react";
import { PanelLeftIcon, PlusIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Narrow rail shown when the sidebar is collapsed.
 *
 * It repeats the two things the hidden sidebar would have offered: the
 * collapse control — which doubles as the way back, since the bar that owns
 * it is gone — and add-source, which otherwise has no entry point at all.
 * The toggle sits at the top, matching where it lives on the open sidebar.
 */
export function SourcesRail({
  onToggle,
  onAddSource,
  className,
}: {
  onToggle: () => void;
  onAddSource: () => void;
  className?: string;
}) {
  return (
    <motion.nav
      aria-label="Sources"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "z-20 flex w-12 shrink-0 flex-col items-center gap-1 border-r border-line bg-sunken py-2.5",
        className,
      )}
    >
      <RailAction label="Show sources" onClick={onToggle} controls="notebook-sources-panel">
        <PanelLeftIcon className="size-4.5" />
      </RailAction>

      <span aria-hidden="true" className="my-1 h-px w-5 bg-line" />

      <RailAction label="Add source" onClick={onAddSource}>
        <PlusIcon className="size-4.5" />
      </RailAction>
    </motion.nav>
  );
}

function RailAction({
  label,
  onClick,
  controls,
  children,
}: {
  label: string;
  onClick: () => void;
  controls?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onClick}
            aria-label={label}
            aria-expanded={controls ? false : undefined}
            aria-controls={controls}
            className="flex size-9 items-center justify-center rounded-lg text-ink-tertiary transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:outline-none"
          >
            {children}
          </button>
        }
      />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}