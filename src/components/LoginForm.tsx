"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setPending(false);

    if (result?.error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-sm">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-white">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
          placeholder="vous@exemple.fr"
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-white">
            Mot de passe
          </label>
          <Link href="/mot-de-passe-oublie" className="text-xs font-semibold text-accent hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 pr-16 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-neutral-400 hover:text-accent"
          >
            {showPassword ? "Masquer" : "Afficher"}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Connexion..." : "Se connecter"}
      </button>
      {error && <p className="text-sm font-medium text-red-400">{error}</p>}
    </form>
  );
}
