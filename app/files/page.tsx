// /files — ID-gated link to the in-house file server at 192.168.1.153:8080.
// The link only works when the visitor is on the house Wi-Fi.

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
