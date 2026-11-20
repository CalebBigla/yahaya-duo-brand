import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";

import { EnquiryConfirmation, FormField } from "./FormField";
import { brand } from "@/lib/brand";
import { buildSchema, submitEnquiry, whatsappFollowUp, type FieldDef, type FormType } from "@/lib/enquiry";
import { useSiteSettings } from "@/lib/useSiteSettings";

export type { FieldDef } from "@/lib/enquiry";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

/**
 * Single-page enquiry form used at the end of the desk and contact pages.
 * Validation runs when a field loses focus; errors are tied to their fields.
 * The confirmation stays until the visitor chooses to send another.
 */
export function InquiryForm({
  title,
  description,
  formType = "contact",
  fields,
}: {
  title: string;
  description?: string;
  formType?: FormType;
  fields: FieldDef[];
}) {
  const settings = useSiteSettings();
  const schema = useMemo(() => buildSchema(fields), [fields]);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [reference, setReference] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: Object.fromEntries(fields.map((f) => [f.name, ""])),
  });

  const onSubmit = async (values: Record<string, string>) => {
    setStatus("submitting");
    try {
      const result = await submitEnquiry({ formType, fields, values });
      setReference(result.reference);
      setStatus("success");
      reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      setStatus("error");
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 text-foreground shadow-soft sm:p-10">
      {status === "success" ? (
        <EnquiryConfirmation
          reference={reference}
          responseTime={brand.responseTime}
          whatsappUrl={whatsappFollowUp(settings.whatsappNumber, reference, title)}
          onReset={() => setStatus("idle")}
        />
      ) : (
        <>
          <h3 className="t-h3 text-primary">{title}</h3>
          {description && <p className="t-body mt-2 text-muted-foreground">{description}</p>}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 grid gap-6 sm:grid-cols-2">
            {fields.map((f) => (
              <FormField
                key={f.name}
                field={f}
                registration={register(f.name)}
                error={errors[f.name]?.message as string | undefined}
                disabled={status === "submitting"}
              />
            ))}

            <div className="sm:col-span-2">
              {status === "error" && (
                <div role="alert" className="mb-6 flex gap-3 rounded-sm border border-destructive/30 bg-destructive/5 p-4">
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
              <button
                type="submit"
                disabled={status === "submitting"}
                className="btn-interactive inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-primary px-8 text-[0.9375rem] font-semibold text-primary-foreground hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />}
                {status === "submitting" ? "Sending" : "Send enquiry"}
              </button>
              <p className="t-small mt-4 text-muted-foreground">
                Handled privately by our team. An advisor will reply {brand.responseTime}.
              </p>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
