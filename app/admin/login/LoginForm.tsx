"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/_actions/auth";

const INITIAL: LoginState = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, INITIAL);

  return (
    <form action={formAction} className="max-w-md space-y-3">
      <label className="block">
        <span className="block mb-1 font-semibold">Admin Password</span>
        <input
          name="password"
          type="password"
          className="fh-input"
          autoComplete="current-password"
          required
        />
      </label>
      <button type="submit" className="fh-btn" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
      {state && !state.ok && (
        <p className="mt-2 p-3 bg-fh-white border-2 border-red-600 text-red-700 rounded">
          {state.error}
        </p>
      )}
    </form>
  );
}
