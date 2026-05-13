"use client";

import { useTransition } from "react";
import { logout } from "@/app/_actions/auth";

export function LogoutButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="fh-btn"
      onClick={() => start(() => logout())}
      disabled={pending}
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
