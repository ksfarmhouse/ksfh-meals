// Roster page client component.
//
// Owns the full list of members in local state so:
//   - Adding a member appends the new row instantly (no page refresh).
//   - Status dropdowns track unsaved edits until the user hits Update.
//   - Remove takes effect both on the server and in the local list.
// Initial rows come from the server component (page.tsx) on first load.

"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  addMember,
  removeMember,
  updateMemberStatuses,
  type AddState,
  type UpdateState,
} from "@/app/_actions/roster";

type HouseStatus = "NewMember" | "InHouse" | "OutOfHouse" | "Alumni";

const STATUSES: Array<{ value: HouseStatus; label: string }> = [
  { value: "NewMember", label: "New Member" },
  { value: "InHouse", label: "In House" },
  { value: "OutOfHouse", label: "Out of House" },
  { value: "Alumni", label: "Alumni" },
];

export interface RosterRow {
  id: string;
  firstName: string;
  lastName: string;
  houseStatus: HouseStatus;
}

const INITIAL_ADD: AddState = null;

function sortRows(rows: RosterRow[]): RosterRow[] {
  return [...rows].sort((a, b) => {
    const last = a.lastName.localeCompare(b.lastName);
    if (last !== 0) return last;
    return a.firstName.localeCompare(b.firstName);
  });
}

interface Props {
  initial: RosterRow[];
}

export function RosterManager({ initial }: Props) {
  const [rows, setRows] = useState<RosterRow[]>(initial);
  const [addState, addAction, addPending] = useActionState(addMember, INITIAL_ADD);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [tablePending, startTransition] = useTransition();
  const [updateMsg, setUpdateMsg] = useState<UpdateState>(null);
  const [removeMsg, setRemoveMsg] = useState<string | null>(null);

  // Append on successful add; reset the form.
  useEffect(() => {
    if (addState && addState.ok) {
      setRows((rs) => sortRows([...rs, addState.member]));
      formRef.current?.reset();
    }
  }, [addState]);

  function setStatus(id: string, s: HouseStatus) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, houseStatus: s } : r)));
  }

  function onUpdate() {
    setUpdateMsg(null);
    startTransition(async () => {
      const res = await updateMemberStatuses(
        rows.map((r) => ({ id: r.id, houseStatus: r.houseStatus })),
      );
      setUpdateMsg(res);
    });
  }

  function onRemove(id: string) {
    if (!confirm(`Remove member ${id}? This cannot be undone.`)) return;
    setRemoveMsg(null);
    startTransition(async () => {
      const res = await removeMember(id);
      if (res?.ok) {
        setRows((rs) => rs.filter((r) => r.id !== id));
        setRemoveMsg(res.message);
      } else if (res) {
        setRemoveMsg(res.error);
      }
    });
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-bold mb-3">Add Member</h2>
        <form ref={formRef} action={addAction} className="space-y-3 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <label className="block">
              <span className="block mb-1 font-semibold">First</span>
              <input name="firstName" type="text" className="fh-input" required />
            </label>
            <label className="block">
              <span className="block mb-1 font-semibold">Last</span>
              <input name="lastName" type="text" className="fh-input" required />
            </label>
            <label className="block">
              <span className="block mb-1 font-semibold">ID (4 chars)</span>
              <input
                name="id"
                type="text"
                inputMode="numeric"
                maxLength={4}
                className="fh-input"
                required
              />
            </label>
            <label className="block">
              <span className="block mb-1 font-semibold">Status</span>
              <select name="houseStatus" className="fh-select" defaultValue="NewMember">
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button type="submit" className="fh-btn" disabled={addPending}>
              {addPending ? "Adding..." : "Add Member"}
            </button>
            {addState && addState.ok && (
              <span className="font-semibold text-fh-green">{addState.message}</span>
            )}
            {addState && !addState.ok && (
              <span className="font-semibold text-red-700">{addState.error}</span>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Members</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              className="fh-btn"
              onClick={onUpdate}
              disabled={tablePending || rows.length === 0}
            >
              {tablePending ? "Saving..." : "Update Members"}
            </button>
            {updateMsg && updateMsg.ok && (
              <span className="font-semibold text-fh-green">{updateMsg.message}</span>
            )}
            {updateMsg && !updateMsg.ok && (
              <span className="font-semibold text-red-700">{updateMsg.error}</span>
            )}
            {removeMsg && (
              <span className="font-semibold text-fh-green">{removeMsg}</span>
            )}
          </div>

          {rows.length === 0 ? (
            <p className="p-4 bg-fh-white border-2 border-fh-green rounded">
              No members yet — add one above.
            </p>
          ) : (
            <>
              {/* Phone layout: stacked cards. Easier to tap status + remove. */}
              <div className="space-y-2 sm:hidden">
                {rows.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-fh-white border-2 border-fh-green rounded space-y-2"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">
                        {r.firstName} {r.lastName}
                      </span>
                      <span className="font-mono text-sm">{r.id}</span>
                    </div>
                    <select
                      className="fh-select"
                      value={r.houseStatus}
                      onChange={(e) =>
                        setStatus(r.id, e.target.value as HouseStatus)
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="fh-btn w-full"
                      onClick={() => onRemove(r.id)}
                      disabled={tablePending}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Tablet / desktop layout: original table. */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="fh-table fh-table-left">
                  <thead>
                    <tr>
                      <th>First</th>
                      <th>Last</th>
                      <th>ID</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.firstName}</td>
                        <td>{r.lastName}</td>
                        <td>{r.id}</td>
                        <td>
                          <select
                            className="fh-select"
                            value={r.houseStatus}
                            onChange={(e) =>
                              setStatus(r.id, e.target.value as HouseStatus)
                            }
                          >
                            {STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="fh-btn"
                            onClick={() => onRemove(r.id)}
                            disabled={tablePending}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
