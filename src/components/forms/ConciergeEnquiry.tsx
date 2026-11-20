import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, ArrowRight, Briefcase, Loader2, Plane } from "lucide-react";

import { EnquiryConfirmation, FormField } from "./FormField";
import { brand } from "@/lib/brand";
import { buildSchema, submitEnquiry, whatsappFollowUp, type FieldDef } from "@/lib/enquiry";
import { tradeServices, travelServices } from "@/lib/site";
import { useSiteSettings } from "@/lib/useSiteSettings";

export type Desk = "travel" | "trade";

const STEPS = ["Desk", "Details", "Contact"] as const;

const detailFields: Record<Desk, FieldDef[]> = {
  travel: [
    { name: "service", label: "What do you need?", type: "select", required: true, options: travelServices.map((s) => s.title), full: true },
    { name: "destination", label: "Destination", placeholder: "e.g. Makkah, Dubai, Istanbul" },
    { name: "dates", label: "Travel dates", type: "date" },
    { name: "message", label: "Anything we should know", type: "textarea", placeholder: "Who is travelling, preferred airline or hotel, special requirements" },
  ],
  trade: [
    { name: "company", label: "Company name", required: true, autoComplete: "organization" },
    { name: "service", label: "Service line", type: "select", required: true, options: tradeServices.map((s) => s.title) },
    { name: "goods", label: "Product or goods", required: true, placeholder: "e.g. AGO, 500 bags of cement", full: true },
    { name: "quantity", label: "Volume or quantity" },
    { name: "delivery", label: "Delivery location" },
    { name: "message", label: "Timeline and other requirements", type: "textarea" },
  ],
};

const contactFields: FieldDef[] = [
  { name: "name", label: "Full name", required: true, autoComplete: "name" },
  { name: "phone", label: "Phone number", type: "tel", required: true, autoComplete: "tel", placeholder: "e.g. 0803 123 4567" },
  { name: "email", label: "Email address", type: "email", autoComplete: "email" },
  { name: "contact_method", label: "How should we reach you?", type: "select", required: true, options: ["WhatsApp", "Phone call", "Email"] },
  { name: "contact_time", label: "Best time", type: "select", options: ["Morning (8am–12pm)", "Afternoon (12pm–4pm)", "Evening (4pm–6pm)", "Any time"] },
];

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Three-step enquiry: (1) which desk, (2) what is needed, (3) how to reach you.
 * Each step validates its own fields before moving on (and each field on blur).
 * Submits through the shared enquiry helper to the existing submissions table.
 */
export function ConciergeEnquiry({ initialDesk, topic }: { initialDesk?: Desk | undefined; topic?: string | undefined }) {
  const settings = useSiteSettings();
  const [desk, setDesk] = useState<Desk | null>(initialDesk ?? null);
  const [step, setStep] = useState(initialDesk ? 1 : 0);
  const [status, setStatus] = useState<Status>("idle");
  const [reference, setReference] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  const fields = useMemo(() => (desk ? [...detailFields[desk], ...contactFields] : contactFields), [desk]);
  const schemaRef = useRef(buildSchema(fields));
  schemaRef.current = buildSchema(fields);

  const resolver: Resolver<Record<string, string>> = (values, context, options) =>
    zodResolver(schemaRef.current)(values, context, options);

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    getValues,
    formState: { errors },
  } = useForm<Record<string, string>>({
    resolver,
    mode: "onTouched",
    shouldUnregister: false,
    defaultValues: {},
  });

  // Move focus to the step heading so screen readers announce the new step.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step, status]);

  const goNext = async () => {
    if (step === 0) {
      if (desk) setStep(1);
      return;
    }
    const names = (desk ? detailFields[desk] : []).map((f) => f.name);
    if (await trigger(names)) setStep(2);
  };

  const onSubmit = async (values: Record<string, string>) => {
    if (!desk) return;
    setStatus("submitting");
    try {
      const result = await submitEnquiry({
        formType: desk,
        fields,
        values: { ...values, division: brand.desks[desk].name },
        extraDetails: topic ? { topic } : {},
      });
      setReference(result.reference);
      setStatus("success");
    } catch (error) {
      console.error("Enquiry submission failed:", error);
      setStatus("error");
    }
  };

  const startAgain = () => {
    reset({});
    setDesk(null);
    setStep(0);
    setStatus("idle");
  };

  if (status === "success" && desk) {
    const v = getValues();
    const summary = [brand.desks[desk].name, v["service"], topic, v["destination"] || v["goods"]].filter(Boolean).join(", ");
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-soft sm:p-10">
        <h2 ref={headingRef} tabIndex={-1} className="sr-only outline-none">
          Enquiry sent
        </h2>
        <EnquiryConfirmation
          reference={reference}
          responseTime={brand.responseTime}
          whatsappUrl={whatsappFollowUp(settings.whatsappNumber, reference, summary ? `About: ${summary}.` : "")}
          onReset={startAgain}
        />
      </div>
    );
  }

  const stepTitle = ["Which desk can help?", desk === "trade" ? "What do you need supplied or moved?" : "Tell us about the journey", "How should we reach you?"][step];

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-soft sm:p-10">
      {/* Progress line */}
      <ol className="grid grid-cols-3 gap-3" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined}>
            <span className={`block h-0.5 rounded-full transition-colors duration-300 ${i <= step ? "bg-primary" : "bg-border"}`} />
            <span className={`t-small mt-2 block ${i === step ? "font-semibold text-primary" : "text-muted-foreground"}`}>
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>

      <h2 ref={headingRef} tabIndex={-1} className="t-h3 mt-10 text-primary outline-none">
        {stepTitle}
      </h2>
      {topic && step > 0 && (
        <p className="t-small mt-3 inline-flex rounded-full bg-secondary px-3 py-1 text-primary">About: {topic}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8">
        {step === 0 && (
          <fieldset>
            <legend className="sr-only">Choose a desk</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["travel", "trade"] as const).map((d) => {
                const Icon = d === "travel" ? Plane : Briefcase;
                const selected = desk === d;
                return (
                  <label
                    key={d}
                    className={`flex cursor-pointer flex-col rounded-lg border p-6 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                      selected ? "border-primary bg-secondary" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <input type="radio" name="desk" value={d} checked={selected} onChange={() => setDesk(d)} className="sr-only" />
                    <Icon className="h-6 w-6 text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
                    <span className="mt-4 font-display text-xl text-primary">{brand.desks[d].name}</span>
                    <span className="t-small mt-2 text-muted-foreground">{brand.desks[d].summary}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {step === 1 && desk && (
          <div className="grid gap-6 sm:grid-cols-2">
            {detailFields[desk].map((f) => (
              <FormField key={f.name} field={f} registration={register(f.name)} error={errors[f.name]?.message as string | undefined} />
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6 sm:grid-cols-2">
            {contactFields.map((f) => (
              <FormField
                key={f.name}
                field={f}
                registration={register(f.name)}
                error={errors[f.name]?.message as string | undefined}
                disabled={status === "submitting"}
              />
            ))}
          </div>
        )}

        {status === "error" && (
          <div role="alert" className="mt-8 flex gap-3 rounded-sm border border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" strokeWidth={1.5} aria-hidden="true" />
            <p className="t-small text-primary">
              We could not send your enquiry. Please try again, or{" "}
              <a href={settings.telHref} className="font-semibold underline underline-offset-4">
                call {settings.primaryPhone}
              </a>
              .
            </p>
          </div>
        )}

        <div className="mt-10 flex flex-col-reverse gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="link-draw inline-flex min-h-11 items-center gap-2 self-start font-semibold text-primary"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              Back
            </button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <button
              type="button"
              onClick={() => void goNext()}
              disabled={step === 0 && !desk}
              className="btn-interactive inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-primary px-8 text-[0.9375rem] font-semibold text-primary-foreground hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={status === "submitting"}
              className="btn-interactive inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-primary px-8 text-[0.9375rem] font-semibold text-primary-foreground hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />}
              {status === "submitting" ? "Sending" : "Send enquiry"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
