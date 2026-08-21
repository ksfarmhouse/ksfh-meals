"use client";

import { useState } from "react";
import { lookupMemberById } from "@/app/_actions/lookup";

// The file-server URL is NOT a prop. It arrives from lookupMemberById only
// after the entered ID clears the check — a URL passed in from the server
// component would be sitting in the public page source, readable without
// entering an ID at all.
export function FilesForm() {
  const [id, setId] = useState("");
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "ok"; name: string; filesUrl: string }
    | { kind: "err"; msg: string }
    | { kind: "pending" }
  >({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "pending" });
    const res = await lookupMemberById(id);
    if (res.ok) setState({ kind: "ok", name: res.fullName, filesUrl: res.filesUrl });
    else setState({ kind: "err", msg: res.error });
  }

  // Pull the host:port out of the URL for the display label, falling back
  // gracefully if the value isn't a parseable URL.
  function hostOf(url: string): string {
    try {
      return new URL(url).host;
    } catch {
      return url;
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-3">
      <label className="block">
        <span className="block mb-1 font-semibold">Member ID</span>
        <input
          name="id"
          type="text"
          inputMode="numeric"
          maxLength={4}
          className="fh-input"
          value={id}
          onChange={(e) => setId(e.target.value)}
          required
        />
      </label>
      <button type="submit" className="fh-btn" disabled={state.kind === "pending"}>
        {state.kind === "pending" ? "Checking..." : "Show Link"}
      </button>

      {state.kind === "ok" && (
        <div className="mt-3 p-3 bg-fh-white border-2 border-fh-green rounded space-y-2">
          <p>
            Welcome, <span className="font-semibold">{state.name}</span>.
          </p>
          <p>
            <a
              href={state.filesUrl}
              className="underline font-semibold hover:text-[var(--fh-gold)]"
            >
              Open Files ({hostOf(state.filesUrl)})
            </a>
          </p>
          <p className="text-sm">
            <strong>Note:</strong> this link only works while you are connected to
            the house Wi-Fi (LAN). Your browser may warn that the site "might not
            be safe" — that's expected; continue past the warning.
          </p>
        </div>
      )}
      {state.kind === "err" && (
        <p className="mt-3 p-3 bg-fh-white border-2 border-red-600 text-red-700 rounded">
          {state.msg}
        </p>
      )}
    </form>
  );
}
