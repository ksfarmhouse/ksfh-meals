// /files — ID-gated link to the in-house file server.
// The actual URL lives in the FILES_LAN_URL env var (validated in
// app/_lib/env.ts, defaulted to http://192.168.1.153:8080/) so the IP
// can change without a code edit + redeploy.

import { FilesForm } from "./FilesForm";
import { env } from "@/app/_lib/env";

export default function FilesPage() {
  return (
    <div>
      <h1 className="fh-page-title">Files</h1>
      <p className="mb-4 text-sm">
        Enter your member ID to reveal the link to the in-house files server.
      </p>
      <FilesForm filesUrl={env.FILES_LAN_URL} />
    </div>
  );
}
