// path: frontend/src/components/email/ParticipantSelector.tsx

'use client';

import { FiSearch, FiUsers, FiSave } from 'react-icons/fi';
import { useState } from 'react';
import type { Participant } from '@/lib/emailApi';

interface Props {
  participants: Participant[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  search: string;
  onSearchChange: (v: string) => void;
  onSaveAsGroup?: () => void;
}

export default function ParticipantSelector({
  participants,
  selectedIds,
  onToggle,
  onToggleAll,
  search,
  onSearchChange,
  onSaveAsGroup,
}: Props) {
  const allSelected =
    participants.length > 0 &&
    participants.every((p) => selectedIds.has(p.id));

  return (
    <div className="rounded-2xl border border-ink-100 bg-white shadow-soft">
      <div className="flex flex-col gap-3 border-b border-ink-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FiUsers className="h-4 w-4 text-primary-600" />
          <h3 className="font-display text-sm font-bold text-ink-950">
            Participants
          </h3>
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-700">
            {participants.length}
          </span>
          {selectedIds.size > 0 && (
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
              {selectedIds.size} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="input-field !py-2.5 !pl-9 !text-sm"
            />
          </div>
          {onSaveAsGroup && selectedIds.size > 0 && (
            <button
              onClick={onSaveAsGroup}
              className="btn-secondary !py-2.5 !text-xs"
            >
              <FiSave className="h-3.5 w-3.5" />
              Save as Group
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-ink-50">
            <tr className="border-b border-ink-100">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-ink-300 text-primary-600"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                Email
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                University
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                Department
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                Level
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {participants.map((p) => (
              <tr
                key={p.id}
                className={`transition-colors ${
                  selectedIds.has(p.id) ? 'bg-primary-50/60' : 'hover:bg-ink-50'
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => onToggle(p.id)}
                    className="h-4 w-4 cursor-pointer rounded border-ink-300 text-primary-600"
                  />
                </td>
                <td className="px-3 py-3 text-sm font-semibold text-ink-900">
                  {p.fullName}
                </td>
                <td className="px-3 py-3 text-sm text-ink-600">{p.email}</td>
                <td className="px-3 py-3 text-sm text-ink-600">
                  {p.universityName}
                </td>
                <td className="px-3 py-3 text-sm text-ink-600">
                  {p.department || '—'}
                </td>
                <td className="px-3 py-3 text-sm text-ink-600">
                  {p.academicStatus}
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-700">
                    {p.researchLevel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {participants.length === 0 && (
          <div className="py-16 text-center">
            <FiUsers className="mx-auto h-10 w-10 text-ink-300" />
            <p className="mt-3 text-sm text-ink-500">
              No participants match your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}