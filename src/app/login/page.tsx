"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const urlError = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }
      if (res?.ok) {
        // Server has set the session cookie; full reload so next request includes it
        window.location.href = callbackUrl;
        return;
      }
      if (res === undefined) setError("Network or server error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h1 className="text-xl font-semibold text-center mb-4">VMS SOW</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Sign in with a seeded user</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="hm@vms.local (vms not vm)"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="CiscoFeb142026"
              required
            />
          </div>
          {(error || urlError) && (
            <p className="text-sm text-red-600">{error || "Sign-in failed. Try again."}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-xs text-gray-400 text-center">
          Use <strong>hm@vms.local</strong> (with &quot;vms&quot;) — password: CiscoFeb142026
        </p>
        <p className="mt-1 text-xs text-gray-400 text-center">
          Also: ops@vms.local, approver50@vms.local, approver200@vms.local, supplier@vms.local
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
