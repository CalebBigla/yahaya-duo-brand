import type { UseFormRegisterReturn } from "react-hook-form";
import { CheckCircle2, MessageCircle } from "lucide-react";
import type { FieldDef } from "@/lib/enquiry";

const control =
  "input-focus mt-2 block min-h-12 w-full rounded-sm border border-input bg-card px-4 text-[1rem] text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-destructive";

/** Label + control + hint + error, wired together for screen readers. */
export function FormField({
  field,
  registration,
  error,
  disabled,
  hint,
}: {
  field: FieldDef;
  registration: UseFormRegisterReturn;
  error?: string | undefined;
  disabled?: boolean;
  hint?: string;
}) {
  const id = `field-${field.name}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    disabled,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    "aria-required": field.required || undefined,
    ...registration,
  };

  return (
    <div className={field.full || field.type === "textarea" ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="text-[0.9375rem] font-semibold text-primary">
        {field.label}
        {field.required ? <span className="text-destructive"> *</span> : <span className="font-normal text-muted-foreground"> (optional)</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea rows={4} placeholder={field.placeholder} className={`${control} py-3`} {...common} />
      ) : field.type === "select" ? (
        <select className={control} defaultValue="" {...common}>
          <option value="">Choose one</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type ?? "text"}
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
          inputMode={field.type === "tel" ? "tel" : undefined}
          className={control}
          {...common}
        />
      )}
      {hint && (
        <p id={hintId} className="t-small mt-1.5 text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="t-small mt-1.5 font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Confirmation that stays on screen until the visitor chooses to start again. */
export function EnquiryConfirmation({
  reference,
  responseTime,
  whatsappUrl,
  onReset,
}: {
  reference: string;
  responseTime: string;
  whatsappUrl: string;
  onReset?: () => void;
}) {
  return (
    <div role="status" aria-live="polite" className="animate-fade-up">
      <CheckCircle2 className="h-8 w-8 text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
      <h3 className="t-h3 mt-5 text-primary">Thank you. Your enquiry is with us.</h3>
      <p className="t-body mt-3 text-muted-foreground">
        An advisor will contact you {responseTime}. Your reference is{" "}
        <span className="font-semibold text-primary tabular-nums">{reference}</span>.
      </p>
      <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-interactive inline-flex min-h-11 items-center gap-2 rounded-sm bg-primary px-6 text-[0.9375rem] font-semibold text-primary-foreground hover:bg-primary-deep"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          Continue on WhatsApp
        </a>
        {onReset && (
          <button type="button" onClick={onReset} className="link-draw min-h-11 font-semibold text-primary">
            Send another enquiry
          </button>
        )}
      </div>
    </div>
  );
}
