import type { ButtonHTMLAttributes, PropsWithChildren, TextareaHTMLAttributes } from "react";
import { Check, Clipboard, Loader2, X } from "lucide-react";
import type { SessionStatus } from "@shared/session";

type Tone = "neutral" | "accent" | "danger";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  loading?: boolean;
}

export function Button({ className, tone = "neutral", loading = false, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cx(
        "inline-flex h-8 items-center justify-center gap-2 rounded-app-sm border px-3 text-[13px] font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-45",
        tone === "accent" && "border-app-accent-strong bg-app-accent-strong text-white hover:bg-app-accent",
        tone === "neutral" && "border-app-border bg-app-panel-elevated text-app-text hover:border-app-subtle",
        tone === "danger" && "border-app-error/50 bg-app-error/10 text-app-error hover:bg-app-error/15",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </button>
  );
}

export type IconButtonProps = ButtonProps & {
  label: string;
};

export function IconButton({ label, className, children, ...props }: IconButtonProps) {
  return (
    <Button aria-label={label} title={label} className={cx("h-8 w-8 px-0", className)} {...props}>
      {children}
    </Button>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        "min-h-20 w-full resize-none rounded-app-sm border border-app-border bg-app-bg px-3 py-2",
        "text-[13px] leading-5 text-app-text placeholder:text-app-subtle",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function Panel({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <section className={cx("border-app-border bg-app-panel shadow-app-panel", className)}>{children}</section>;
}

export function PanelHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex min-h-12 items-center justify-between gap-3 border-b border-app-divider px-3">
      <div className="min-w-0">
        <h2 className="truncate text-[13px] font-semibold text-app-text">{title}</h2>
        {description ? <p className="mt-0.5 truncate text-[11px] text-app-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Badge({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cx(
        "inline-flex h-5 items-center rounded-app-xs border border-app-border bg-app-panel-elevated px-1.5",
        "text-[11px] font-medium text-app-muted",
        className
      )}
    >
      {children}
    </span>
  );
}

const statusClasses: Record<SessionStatus, string> = {
  idle: "text-app-muted border-app-border",
  ready: "text-app-success border-app-success/40 bg-app-success/10",
  running: "text-app-running border-app-running/40 bg-app-running/10",
  aborting: "text-app-warning border-app-warning/40 bg-app-warning/10",
  errored: "text-app-error border-app-error/40 bg-app-error/10",
  disposed: "text-app-disposed border-app-border",
  stopped: "text-app-stopped border-app-warning/40 bg-app-warning/10"
};

export function StatusBadge({ status }: { status: SessionStatus }) {
  return <Badge className={statusClasses[status]}>{status}</Badge>;
}

export function Spinner({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <Loader2
      className={cx("animate-spin text-current", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")}
      aria-hidden="true"
    />
  );
}

export function Tabs({
  tabs,
  value,
  onChange
}: {
  tabs: Array<{ value: string; label: string; count?: number }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-app-sm border border-app-border bg-app-bg p-0.5" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={cx(
            "flex h-7 items-center gap-1.5 rounded-app-xs px-2 text-[12px] font-medium transition-colors",
            value === tab.value ? "bg-app-panel-elevated text-app-text" : "text-app-muted hover:text-app-text"
          )}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {typeof tab.count === "number" ? <span className="text-[10px] text-app-subtle">{tab.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-28 flex-col justify-center rounded-app-sm border border-dashed border-app-border p-4">
      <p className="text-[13px] font-medium text-app-text">{title}</p>
      <p className="mt-1 text-[12px] leading-5 text-app-muted">{description}</p>
    </div>
  );
}

export function ErrorBanner({
  title,
  description,
  onDismiss
}: {
  title: string;
  description: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="rounded-app-sm border border-app-error/40 bg-app-error/10 px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-app-error">{title}</p>
          <p className="mt-1 text-[12px] leading-5 text-app-muted">{description}</p>
        </div>
        {onDismiss ? (
          <IconButton label="Dismiss error" className="h-7 w-7 shrink-0" onClick={onDismiss}>
            <X className="h-3.5 w-3.5" />
          </IconButton>
        ) : null}
      </div>
    </div>
  );
}

export function InlineError({ children }: PropsWithChildren) {
  return <p className="text-[12px] text-app-error">{children}</p>;
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-auto rounded-app-sm border border-app-border bg-app-bg p-3 text-[12px] leading-5 text-app-muted">
      <code>{code}</code>
    </pre>
  );
}

export function JsonViewer({ value }: { value: unknown }) {
  return <CodeBlock code={JSON.stringify(value, null, 2)} />;
}

export function CopyButton({ value, copied = false }: { value: string; copied?: boolean }) {
  return (
    <IconButton
      label={copied ? "Copied" : "Copy"}
      onClick={() => {
        void navigator.clipboard?.writeText(value);
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
    </IconButton>
  );
}
