// /find-id — public lookup. Enter your full name, get your 4-digit ID.

import { FindIdForm } from "./FindIdForm";

export default function FindIdPage() {
  return (
    <div>
      <h1 className="fh-page-title">Find ID</h1>
      <p className="mb-4 text-sm">
        Enter your full name to look up your member ID.
      </p>
      <FindIdForm />
    </div>
  );
}
