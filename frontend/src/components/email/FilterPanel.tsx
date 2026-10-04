// path: frontend/src/components/email/FilterPanel.tsx

'use client';

import { FiFilter, FiX } from 'react-icons/fi';
import type { EmailFilters, FilterOptions } from '@/lib/emailApi';

interface Props {
  filters: EmailFilters;
  options: FilterOptions;
  onChange: (filters: EmailFilters) => void;
  onReset: () => void;
}

export default function FilterPanel({
  filters,
  options,
  onChange,
  onReset,
}: Props) {
  const update = (key: keyof EmailFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const activeCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== null && v !== ''
  ).length;

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiFilter className="h-4 w-4 text-primary-600" />
          <h3 className="font-display text-sm font-bold text-ink-950">
            Advanced Filters
          </h3>
          {activeCount > 0 && (
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
          >
            <FiX className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label-field !text-xs">University</label>
          <select
            value={filters.university || ''}
            onChange={(e) => update('university', e.target.value)}
            className="input-field !py-2.5 !text-sm"
          >
            <option value="">All Universities</option>
            {options.universities.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-field !text-xs">Department</label>
          <select
            value={filters.department || ''}
            onChange={(e) => update('department', e.target.value)}
            className="input-field !py-2.5 !text-sm"
          >
            <option value="">All Departments</option>
            {options.departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-field !text-xs">Academic Status</label>
          <select
            value={filters.academicStatus || ''}
            onChange={(e) => update('academicStatus', e.target.value)}
            className="input-field !py-2.5 !text-sm"
          >
            <option value="">All Statuses</option>
            {options.academicStatuses.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-field !text-xs">Research Level</label>
          <select
            value={filters.researchLevel || ''}
            onChange={(e) => update('researchLevel', e.target.value)}
            className="input-field !py-2.5 !text-sm"
          >
            <option value="">All Levels</option>
            {options.researchLevels.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-field !text-xs">Higher Study Interest</label>
          <select
            value={filters.higherStudyInterest || ''}
            onChange={(e) =>
              update('higherStudyInterest', e.target.value as any)
            }
            className="input-field !py-2.5 !text-sm"
          >
            <option value="">All</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div>
          <label className="label-field !text-xs">Registration Source</label>
          <select
            value={filters.registrationSource || ''}
            onChange={(e) => update('registrationSource', e.target.value)}
            className="input-field !py-2.5 !text-sm"
          >
            <option value="">All Sources</option>
            {options.registrationSources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-field !text-xs">Registered From</label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => update('dateFrom', e.target.value)}
            className="input-field !py-2.5 !text-sm"
          />
        </div>

        <div>
          <label className="label-field !text-xs">Registered To</label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => update('dateTo', e.target.value)}
            className="input-field !py-2.5 !text-sm"
          />
        </div>
      </div>
    </div>
  );
}