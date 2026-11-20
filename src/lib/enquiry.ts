/**
 * Shared enquiry submission for every public form.
 *
 * Writes to the existing `submissions` table (no schema change): known fields go to
 * their own columns, everything else to `submissions.details` (JSON, added in T01).
 * Each enquiry gets a short client-side reference (e.g. YT-7K3F9Q) stored in
 * details.reference, because anonymous visitors cannot read back the inserted row.
 */
import { z } from "zod";
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
  autoComplete?: string;
};

export type FormType = "travel" | "trade" | "contact";

// The database requires phone numbers of at least 10 characters (submissions.valid_phone).
export const MIN_PHONE_DIGITS = 10;
const countDigits = (value: string) => value.replace(/\D/g, "").length;

export function buildSchema(fields: FieldDef[]) {
  const shape: Record<string, z.ZodType<string, string>> = {};
  for (const f of fields) {
    const max = f.maxLength ?? (f.type === "textarea" ? 1000 : 120);
    let base = z.string().trim().max(max, { message: `Keep this under ${max} characters` });
    if (f.type === "email") {
      base = base.email({ message: "Enter a valid email address, e.g. name@company.com" });
    }
    if (f.type === "tel") {
      base = base
        .regex(/^[0-9+()\-\s]*$/, { message: "Use digits only, with optional + ( ) or spaces" })
        .refine((v) => v === "" || countDigits(v) >= MIN_PHONE_DIGITS, {
          message: `Enter a phone number with at least ${MIN_PHONE_DIGITS} digits, e.g. 0803 123 4567`,
        });
    }
    shape[f.name] = f.required
      ? base.min(f.type === "tel" ? 1 : 2, { message: `${f.label} is required` })
      : base.or(z.literal(""));
  }
  return z.object(shape);
}

/** Fields stored in their own submissions column. Everything else goes into details. */
const COLUMN_FIELDS = new Set(["name", "email", "phone", "division", "destination", "dates", "service", "message"]);

/** A short, readable reference: YT- plus 6 characters without look-alikes (0/O, 1/I). */
export function newReference(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `YT-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
}

export async function submitEnquiry({
  formType,
  fields,
  values,
  extraDetails = {},
}: {
  formType: FormType;
  fields: FieldDef[];
  values: Record<string, string>;
  extraDetails?: Record<string, string>;
}): Promise<{ reference: string }> {
  const reference = newReference();
  const timelineUsedAsDates = !values["dates"] && !!values["timeline"];

  // Only fields currently on the form, so stale values from an earlier step or
  // service selection are never sent.
  const details: Record<string, string> = { reference };
  for (const f of fields) {
    if (COLUMN_FIELDS.has(f.name)) continue;
    if (f.name === "timeline" && timelineUsedAsDates) continue;
    const value = (values[f.name] ?? "").trim();
    if (value) details[f.name] = value;
  }
  for (const [k, v] of Object.entries(extraDetails)) if (v.trim()) details[k] = v.trim();

  const pick = (name: string) => (values[name] ?? "").trim() || null;
  const submission = {
    form_type: formType,
    name: pick("name"),
    email: pick("email"),
    phone: pick("phone"),
    division: pick("division"),
    destination: pick("destination"),
    dates: pick("dates") || pick("timeline"),
    service: pick("service"),
    message: pick("message"),
    details,
    status: "new" as const,
  };

  await queueQuery(async () => {
    const { error } = await supabase.from("submissions").insert([submission]);
    if (error) throw error;
  });
  return { reference };
}

/** WhatsApp message that carries the reference and a short summary of the enquiry. */
export function whatsappFollowUp(whatsappNumber: string, reference: string, summary: string) {
  const text = `Hello Yahaya, I have just sent an enquiry (ref ${reference}). ${summary}`.trim();
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
}
