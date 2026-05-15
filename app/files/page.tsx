// /files — ID-gated link to the in-house file server.
// The actual URL lives in the FILES_LAN_URL env var so the IP can change
// without a code edit + redeploy. Defaults to the original 192.168.1.153:8080
// if the env var isn't set.

import { FilesForm } from "./FilesForm";

const DEFAULT_FILES_URL = "http://192.168.1.153:8080/";

export default function FilesPage() {
  const filesUrl = process.env.FILES_LAN_URL || DEFAULT_FILES_URL;

  return (
    <div>
      <h1 className="fh-page-title">Files</h1>
      <p className="mb-4 text-sm">
        Enter your member ID to reveal the link to the in-house files server.
      </p>
      <FilesForm filesUrl={filesUrl} />
    </div>
  );
}
