// /find-id — password-gated lookup. Enter your full name and the house
// password, get your 4-digit ID. The password is checked server-side in
// lookupMemberByName, so the roster isn't reachable without it.

import { FindIdForm } from "./FindIdForm";

export default function FindIdPage() {
  return (
    <div>
      <h1 className="fh-page-title">Find ID</h1>
      <p className="mb-4 text-sm">
        Enter your full name and the house password to look up your member ID.
      </p>
      <FindIdForm />
    </div>
  );
}
