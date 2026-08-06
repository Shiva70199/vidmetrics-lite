"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutShell } from "@/components/LayoutShell";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register, token } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password);
      showToast("Account created.", "success");
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Registration failed.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LayoutShell>
      <section className="mx-auto w-full max-w-md py-12">
        <div className="premium-card p-8">
          <p className="section-title">Create account</p>
          <h1 className="mt-2 text-2xl font-extrabold text-black">Get started</h1>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Email
              </label>
              <input
                type="email"
                required
                className="input-surface mt-2 rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                className="input-surface mt-2 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="accent-button w-full rounded-xl">
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>
          <p className="mt-4 text-sm text-neutral-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#2563eb] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </LayoutShell>
  );
}
