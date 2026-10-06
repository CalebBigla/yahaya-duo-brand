import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { queueQuery } from "@/lib/queryQueue";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "date" | "textarea" | "select";
  options?: readonly string[];
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  full?: boolean;
};

function buildSchema(fields: FieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    const max = f.maxLength ?? (f.type === "textarea" ? 1000 : 120);
    let base = z.string().trim().max(max, { message: `Keep this under ${max} characters` });
    if (f.type === "email") {
      base = base.email({ message: "Enter a valid email address" });
    }
    if (f.type === "tel") {
      base = base.regex(/^[0-9+()\-\s]*$/, { message: "Enter a valid phone number" });
    }
    shape[f.name] = f.required
      ? base.min(f.type === "tel" ? 7 : 2, { message: `${f.label} is required` })
      : base.optional().or(z.literal(""));
  }
  return z.object(shape);
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export function InquiryForm({
  title,
  description,
  formType = 'contact',
  fields,
}: {
  title: string;
  description?: string;
  formType?: 'travel' | 'trade' | 'contact';
  fields: FieldDef[];
}) {
  const schema = useMemo(() => buildSchema(fields), [fields]);
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(fields.map((f) => [f.name, ""])),
  });

  const onSubmit = async (values: Record<string, string>) => {
    setStatus('submitting');
    setErrorMessage('');

    try {
      // Map form values to database fields
      const submission = {
        form_type: formType,
        name: values['name'] || null,
        email: values['email'] || null,
        phone: values['phone'] || null,
        division: values['division'] || null,
        destination: values['destination'] || null,
        dates: values['dates'] || values['timeline'] || null,
        service: values['service'] || null,
        message: values['message'] || null,
        status: 'new' as const,
      };

      await queueQuery(async () => {
        const { error } = await supabase
          .from('submissions')
          .insert([submission]);

        if (error) throw error;
      });

      setStatus('success');
      reset();

      // Reset success message after 5 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus('error');
      setErrorMessage('Failed to submit your enquiry. Please try again or contact us directly.');
    }
  };

  return (
    <div className="card-interactive rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
      <h3 className="font-display text-2xl font-bold text-primary">{title}</h3>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}

      {status === 'success' ? (
        <div className="mt-6 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <h4 className="font-bold text-green-900 dark:text-green-100">Enquiry submitted successfully!</h4>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                Thank you for contacting us. We've received your enquiry and will respond within 24 hours on business days.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-4 text-sm font-semibold text-green-700 dark:text-green-300 underline hover:no-underline"
              >
                Submit another enquiry
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
          {fields.map((f) => {
            const err = errors[f.name]?.message as string | undefined;
            const id = `field-${f.name}`;
            const cls =
              "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50 disabled:cursor-not-allowed";
            return (
              <div key={f.name} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
                <label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {f.label}
                  {f.required && <span className="text-destructive"> *</span>}
                </label>

                {f.type === "textarea" ? (
                  <textarea 
                    id={id} 
                    rows={4} 
                    placeholder={f.placeholder} 
                    className={`${cls} input-focus`} 
                    disabled={status === 'submitting'}
                    {...register(f.name)} 
                  />
                ) : f.type === "select" ? (
                  <select 
                    id={id} 
                    className={`${cls} input-focus`} 
                    disabled={status === 'submitting'}
                    {...register(f.name)} 
                    defaultValue=""
                  >
                    <option value="">Select an option</option>
                    {f.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={id}
                    type={f.type ?? "text"}
                    placeholder={f.placeholder}
                    className={`${cls} input-focus`}
                    disabled={status === 'submitting'}
                    {...register(f.name)}
                  />
                )}

                {err && <p className="mt-1 text-xs font-medium text-destructive">{err}</p>}
              </div>
            );
          })}

          <div className="sm:col-span-2">
            {status === 'error' && (
              <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                  <div>
                    <h4 className="font-bold text-red-900 dark:text-red-100">Submission failed</h4>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="btn-interactive inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Enquiry
                </>
              )}
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              Your enquiry will be securely stored and reviewed by our team. We respond within 24 hours on business days.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
