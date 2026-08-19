"use client";

import { useCommerce } from "@/components/subscription/CommerceProvider";

const PHONE_RE = /^[0-9+\-\s]{9,32}$/;

export function validateDelivery(d: { fullName: string; phone: string; city: string; street: string }) {
  const errors: Record<string, string> = {};
  if (d.fullName.trim().length < 2) errors.fullName = "Enter your full name.";
  if (!PHONE_RE.test(d.phone.trim())) errors.phone = "Enter a valid phone number (e.g. 0300 1234567).";
  if (d.city.trim().length < 2) errors.city = "Enter your city.";
  if (d.street.trim().length < 5) errors.street = "Enter your full delivery address.";
  return errors;
}

export function DeliveryForm() {
  const { draft, dispatch } = useCommerce();
  const d = draft.delivery;

  const fields: Array<{
    key: keyof typeof d;
    label: string;
    type?: string;
    placeholder: string;
    autoComplete: string;
    required?: boolean;
    colSpan?: boolean;
  }> = [
    {
      key: "fullName",
      label: "Full name",
      placeholder: "Ahmed Raza",
      autoComplete: "name",
      required: true,
      colSpan: true,
    },
    { key: "phone", label: "Phone (WhatsApp preferred)", type: "tel", placeholder: "0300 1234567", autoComplete: "tel", required: true, colSpan: true },
    { key: "city", label: "City", placeholder: "Lahore", autoComplete: "address-level2", required: true },
    { key: "street", label: "Delivery address", placeholder: "House 12, Street 4, Gulberg III", autoComplete: "street-address", required: true, colSpan: true },
    { key: "note", label: "Delivery note (optional)", placeholder: "Call before arriving, gate code 1122", autoComplete: "off" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <label key={f.key} className={f.colSpan ? "sm:col-span-2" : ""}>
          <span className="t-label text-[0.62rem] text-ink-3">
            {f.label}
            {f.required ? <span aria-hidden className="text-error"> *</span> : null}
          </span>
          <input
            type={f.type ?? "text"}
            value={d[f.key]}
            onChange={(e) => dispatch({ type: "setDelivery", field: f.key, value: e.target.value })}
            placeholder={f.placeholder}
            autoComplete={f.autoComplete}
            required={f.required}
            className="mt-2 w-full rounded-md border border-line bg-cream px-4 py-3 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-bronze"
          />
        </label>
      ))}
    </div>
  );
}
