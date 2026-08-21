// /files — ID-gated link to the in-house file server.
//
// The URL lives in the FILES_LAN_URL env var (validated in app/_lib/env.ts)
// and is deliberately NOT rendered here. It's returned by lookupMemberById
// once the entered ID clears, so it never appears in the public page source.

import { FilesForm } from "./FilesForm";

export default function FilesPage() {
  return (
    <div>
      <h1 className="fh-page-title">Files</h1>
      <p className="mb-4 text-sm">
        Enter your member ID to reveal the link to the in-house files server.
      </p>
      <FilesForm />
    </div>
  );
}
