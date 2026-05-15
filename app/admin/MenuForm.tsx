"use client";

import { useActionState } from "react";
import { saveMenu, type SaveMenuState } from "@/app/_actions/menu";
import { WEEKDAYS } from "@/app/_lib/meals";

interface Props {
  initialLunch: string[];
  initialDinner: string[];
}

const INITIAL: SaveMenuState = null;

export function MenuForm({ initialLunch, initialDinner }: Props) {
  const [state, formAction, pending] = useActionState(saveMenu, INITIAL);

  return (
    <form action={formAction} className="space-y-6">
      <div className="overflow-x-auto">
        <table className="fh-table mx-auto">
          <thead>
            <tr>
              {WEEKDAYS.map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {[0, 1, 2, 3, 4].map((i) => (
                <td key={i}>
                  <input
                    name={`lunch_${i}`}
                    type="text"
                    className="fh-input"
                    defaultValue={initialLunch[i] ?? ""}
                  />
                </td>
              ))}
            </tr>
            <tr>
              {[0, 1, 2, 3, 4].map((i) => (
                <td key={i}>
                  <input
                    name={`dinner_${i}`}
                    type="text"
                    className="fh-input"
                    defaultValue={initialDinner[i] ?? ""}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto">
        <table className="fh-table mx-auto max-w-md">
          <thead>
            <tr>
              <th>Sat</th>
              <th>Sun</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input
                  name="lunch_5"
                  type="text"
                  className="fh-input"
                  defaultValue={initialLunch[5] ?? ""}
                />
              </td>
              <td>
                <input
                  name="lunch_6"
                  type="text"
                  className="fh-input"
                  defaultValue={initialLunch[6] ?? ""}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="submit" className="fh-btn" disabled={pending}>
          {pending ? "Saving..." : "Save Menu"}
        </button>
        {state && state.ok && (
          <span className="font-semibold text-fh-green">{state.message}</span>
        )}
        {state && !state.ok && (
          <span className="font-semibold text-red-700">{state.error}</span>
        )}
      </div>
    </form>
  );
}
