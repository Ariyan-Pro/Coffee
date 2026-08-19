"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button, IconCheck } from "@/components/ui/primitives";
import { whatsappLink } from "@/data/site";

type Status = "idle" | "loading" | "success" | "error";

const REQUIRED = ["name", "email", "message"] as const;

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [values, setValues] = useState({ name: "", email: "", subject: "", message: "" });

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const missing = REQUIRED.filter((k) => values[k].trim().length === 0);
    if (missing.length) {
      setError("Please fill in the required fields.");
      return;
    }
    setStatus("loading");
    setError("");

    // Integration point: POST /api/v1/contact when the backend exposes it.
    await new Promise((r) => setTimeout(r, 900));
    setStatus("success");
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-line bg-cream p-8 text-center md:p-12" role="status">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15">
          <IconCheck className="h-7 w-7 text-success" />
        </span>
        <h3 className="t-heading-m mt-6">Message sent.</h3>
        <p className="t-body-m pretty mt-3 text-ink-2">
          Thanks, {values.name.split(" ")[0]}. We reply within one working day, usually much
          faster on WhatsApp.
        </p>
        <Button variant="ghost" onClick={() => setStatus("idle")}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-line bg-cream p-6 md:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className="t-label text-[0.62rem] text-ink-3">Your name</span>
          <input
            required
            value={values.name}
            onChange={set("name")}
            placeholder="Ayesha Khan"
            autoComplete="name"
            className="mt-2 w-full rounded-md border border-line bg-paper px-4 py-3 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-bronze"
          />
        </label>
        <label>
          <span className="t-label text-[0.62rem] text-ink-3">Email</span>
          <input
            required
            type="email"
            value={values.email}
            onChange={set("email")}
            placeholder="you@email.com"
            autoComplete="email"
            className="mt-2 w-full rounded-md border border-line bg-paper px-4 py-3 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-bronze"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="t-label text-[0.62rem] text-ink-3">Subject</span>
          <input
            value={values.subject}
            onChange={set("subject")}
            placeholder="How can we help?"
            className="mt-2 w-full rounded-md border border-line bg-paper px-4 py-3 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-bronze"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="t-label text-[0.62rem] text-ink-3">Message</span>
          <textarea
            required
            rows={5}
            value={values.message}
            onChange={set("message")}
            placeholder="Tell us about your subscription, an order, or your favourite cup so far."
            className="mt-2 w-full resize-y rounded-md border border-line bg-paper px-4 py-3 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-bronze"
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="t-caption mt-4 font-medium text-error">
          {error}
        </p>
      )}

      <div className="mt-6">
        <Button type="submit" size="lg" disabled={status === "loading"}>
          {status === "loading" ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/30 border-t-paper" aria-hidden />
              Sending…
            </>
          ) : (
            "Send message"
          )}
        </Button>
        {whatsappLink() && (
          <Button href={whatsappLink("Hi EMBER, I have a question.")} variant="secondary" className="ml-3">
            Message on WhatsApp
          </Button>
        )}
      </div>
    </form>
  );
}
