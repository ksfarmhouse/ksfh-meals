// Single plate-count card. Shows the meal name, member count in the title,
// an optional "extra" block (set-for line), and the list of member names.

interface Props {
  title: string;
  names: string[];
  extra?: React.ReactNode;
}

export function PlateCard({ title, names, extra }: Props) {
  return (
    <div className="fh-card">
      <h3>
        {title} ({names.length})
      </h3>
      {extra && <div className="mb-2 text-sm font-semibold">{extra}</div>}
      {names.length === 0 ? (
        <p className="text-sm italic">— none —</p>
      ) : (
        <ul className="text-sm space-y-0.5">
          {names.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
