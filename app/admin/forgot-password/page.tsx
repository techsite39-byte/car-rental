"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      setMessage(result.message ?? result.error ?? "Request received.");
    } catch {
      setMessage("The reset request could not be submitted. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="admin-app">
      <section className="admin-auth-screen">
        <div className="admin-auth-panel">
          <p className="admin-eyebrow">EPICDRIVE / ADMIN</p>
          <h1>Forgot password</h1>
          <p>Enter the configured admin email to request a secure reset link.</p>
          <form onSubmit={submit}>
            <label className="admin-field" htmlFor="reset-email">
              <span>Email</span>
              <input id="reset-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
            </label>
            {message ? <p className="admin-error" role="status">{message}</p> : null}
            <button className="admin-button admin-button--primary" disabled={pending} type="submit">
              {pending ? "Submitting…" : "Request reset link"}
            </button>
          </form>
          <Link href="/admin">Back to admin login</Link>
        </div>
      </section>
    </main>
  );
}
