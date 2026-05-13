// Error boundary for any unhandled exception thrown anywhere in the app.
// Next.js auto-mounts this whenever a route or server action blows up.
//
// We pattern-match the error message to detect common database failures
// (Supabase pause, deletion, connection refused, etc.) and show specific
// recovery instructions; everything else falls back to a generic message.

"use client";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

// Match Prisma error codes, connection failures, and Supabase pause signals.
const DB_ERROR_PATTERN =
  /prisma|P\d{4}|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|connect.*timeout|database|relation .* does not exist|password authentication failed|Tenant or user not found/i;

export default function ErrorPage({ error, reset }: Props) {
  const looksLikeDb = DB_ERROR_PATTERN.test(error.message ?? "");

  return (
    <div className="max-w-3xl">
      <h1 className="fh-page-title">Something went wrong</h1>

      {looksLikeDb ? (
        <div className="space-y-4 text-sm">
          <p className="p-3 bg-fh-white border-2 border-fh-green rounded font-semibold">
            We couldn't reach the database.
          </p>
          <p>
            On the free Supabase plan, projects pause after about a week of
            inactivity and are deleted after about 90 days. If the meal site
            sits unused over winter or summer break this is what you'll see
            when it comes back online.
          </p>

          <h2 className="text-base font-semibold mt-4">If the project is paused</h2>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              Open the Supabase dashboard and find the meal-site project.
            </li>
            <li>
              Click <strong>Restore project</strong>. It takes ~1 minute.
            </li>
            <li>All data (members, menu, sign-ups) is preserved.</li>
            <li>Click "Try again" below.</li>
          </ol>

          <h2 className="text-base font-semibold mt-4">If the project was deleted</h2>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Create a new Supabase project.</li>
            <li>
              Grab the new <code>DATABASE_URL</code> and <code>DIRECT_URL</code>{" "}
              and update them in Vercel's environment variables (and in your
              local <code>.env</code>).
            </li>
            <li>
              On your laptop, run <code>npm run db:recover</code>. It pushes the
              schema and seeds the placeholder menu. It will refuse to run if
              the new database already has members — that's a guardrail.
            </li>
            <li>Redeploy from Vercel (or just retry — Vercel picks up env-var changes on next request).</li>
          </ol>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <p>An unexpected error occurred.</p>
          {error.digest && (
            <p className="font-mono text-xs">Error digest: {error.digest}</p>
          )}
        </div>
      )}

      <button onClick={reset} className="fh-btn mt-6">
        Try again
      </button>
    </div>
  );
}
