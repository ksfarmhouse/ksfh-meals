"use client";

import { useActionState } from "react";
import { lookupMemberByName, type LookupNameResult } from "@/app/_actions/lookup";

const INITIAL: LookupNameResult | null = null;

export function FindIdForm() {
  const [state, formAction, pending] = useActionState(lookupMemberByName, INITIAL);

  return (
    <form action={formAction} className="max-w-md space-y-3">
      <label className="block">
        <span className="block mb-1 font-semibold">Full Name</span>
        <input
          name="name"
          type="text"
          className="fh-input"
          placeholder="First Last"
          required
        />
      </label>
      <button type="submit" className="fh-btn" disabled={pending}>
        {pending ? "Looking up..." : "Find ID"}
      </button>

      {state && state.ok && (
        <p className="mt-3 p-3 bg-fh-white border-2 border-fh-green rounded">
          <span className="font-semibold">{state.fullName}</span>'s ID is{" "}
          <span className="font-bold text-lg">{state.id}</span>
        </p>
      )}
      {state && !state.ok && (
        <p className="mt-3 p-3 bg-fh-white border-2 border-red-600 text-red-700 rounded">
          {state.error}
        </p>
      )}
    </form>
  );
}
