import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/site";

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

export function InquiryForm({
  title,
  description,
  intro,
  fields,
}: {
  title: string;
  description?: string;
  intro: string;
  fields: FieldDef[];
}) {
  const schema = useMemo(() => buildSchema(fields), [fields]);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(fields.map((f) => [f.name, ""])),
  });

  const onSubmit = (values: Record<string, string>) => {
    const lines = fields
      .filter((f) => values[f.name]?.trim())
      .map((f) => `${f.label}: ${(values[f.name] ?? "").trim()}`);
    const message = `${intro}\n\n${lines.join("\n")}`;
    window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
    setSent(true);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
      <h3 className="font-display text-2xl font-bold text-primary">{title}</h3>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const err = errors[f.name]?.message as string | undefined;
          const id = `field-${f.name}`;
          const cls =
            "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/30";
          return (
            <div key={f.name} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
              <label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {f.label}
                {f.required && <span className="text-destructive"> *</span>}
              </label>

              {f.type === "textarea" ? (
                <textarea id={id} rows={4} placeholder={f.placeholder} className={cls} {...register(f.name)} />
              ) : f.type === "select" ? (
                <select id={id} className={cls} {...register(f.name)} defaultValue="">
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
                  className={cls}
                  {...register(f.name)}
                />
              )}

              {err && <p className="mt-1 text-xs font-medium text-destructive">{err}</p>}
            </div>
          );
        })}

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 sm:w-auto"
          >
            <MessageCircle className="h-4 w-4" />
            Send via WhatsApp
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            Your details are packaged into a WhatsApp message you can review before sending. Nothing is
            stored on this site.
          </p>
          {sent && (
            <p className="mt-2 text-xs font-semibold text-primary">
              WhatsApp opened in a new tab — press send there to reach our team.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
