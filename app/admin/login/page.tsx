// /admin/login — the one /admin/* page allowed without auth (so the user
// can actually reach the password form). See middleware.ts.

import { LoginForm } from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <div>
      <h1 className="fh-page-title">Admin</h1>
      <p className="mb-4 text-sm">Enter the admin password to manage the menu and roster.</p>
      <LoginForm />
    </div>
  );
}
