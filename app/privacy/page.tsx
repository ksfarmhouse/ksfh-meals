// /privacy — required by the footer link. Plain text describing what data
// the site stores (member names, statuses, meal sign-ups, owed counts).

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function PrivacyPage() {
  const now = new Date();
  const lastUpdated = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div className="max-w-3xl">
      <h1 className="fh-page-title">Privacy</h1>
      <p className="text-sm mb-6">Last Updated: {lastUpdated}</p>

      <section className="space-y-4 text-sm leading-relaxed">
        <p>
          The KSFH Meals website is operated for the internal use of the K-State
          FarmHouse fraternity. This page describes what data the site stores
          and how it is used.
        </p>

        <h2 className="text-lg font-semibold mt-6">What we collect</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Member names</strong> (first and last) and a 4-digit member
            ID chosen at sign-up.
          </li>
          <li>
            <strong>House status</strong>: New Member, In House, Out of House,
            or Alumni.
          </li>
          <li>
            <strong>Meal sign-ups</strong>: each member's weekly and default
            meal plans across the 12 weekly meal slots.
          </li>
          <li>
            <strong>Attendance counts</strong>: lunches and dinners owed for
            out-of-house members.
          </li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">How we use it</h2>
        <p>
          Member data is used solely to plan meals, generate plate counts for
          the kitchen, and produce the treasurer report. The data is not shared
          with anyone outside of the fraternity's officers and kitchen staff.
        </p>

        <h2 className="text-lg font-semibold mt-6">Admin features</h2>
        <p>
          Editing the menu, running rollovers, and managing the roster are
          restricted to administrators and require a password. Administrative
          sessions are protected by a signed cookie.
        </p>

        <h2 className="text-lg font-semibold mt-6">Storage</h2>
        <p>
          Data is stored in a managed Postgres database. The site does not set
          tracking cookies and does not load third-party analytics.
        </p>
      </section>
    </div>
  );
}
