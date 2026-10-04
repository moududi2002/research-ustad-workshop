// path: frontend/src/components/email/GroupManager.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  FiX,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiSave,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  addMembersToGroup,
  getGroup,
  type EmailGroup,
} from '@/lib/emailApi';

interface Props {
  open: boolean;
  onClose: () => void;
  onUseGroup: (memberIds: string[]) => void;
  pendingSelection?: string[];
}

export default function GroupManager({
  open,
  onClose,
  onUseGroup,
  pendingSelection,
}: Props) {
  const [groups, setGroups] = useState<EmailGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await listGroups();
      setGroups(data);
    } catch {
      toast.error('Failed to load groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Group name is required.');
      return;
    }
    try {
      setCreating(true);
      await createGroup({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        memberIds: pendingSelection && pendingSelection.length ? pendingSelection : undefined,
      });
      toast.success('Group created.');
      setNewName('');
      setNewDesc('');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create group.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this group?')) return;
    try {
      await deleteGroup(id);
      toast.success('Group deleted.');
      load();
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const handleRename = async (id: string, currentName: string) => {
    const name = window.prompt('Rename group:', currentName);
    if (!name || name === currentName) return;
    try {
      await updateGroup(id, { name });
      toast.success('Renamed.');
      load();
    } catch {
      toast.error('Rename failed.');
    }
  };

  const handleUse = async (id: string) => {
    try {
      const detail = await getGroup(id);
      const ids = (detail.members || [])
        .map((m: any) => m.registrationId)
        .filter(Boolean);
      if (ids.length === 0) {
        toast.error('This group has no members.');
        return;
      }
      onUseGroup(ids);
      toast.success(`${ids.length} participants loaded.`);
      onClose();
    } catch {
      toast.error('Failed to load group members.');
    }
  };

  const handleAddSelectionTo = async (id: string) => {
    if (!pendingSelection || pendingSelection.length === 0) {
      toast.error('No participants selected.');
      return;
    }
    try {
      await addMembersToGroup(id, pendingSelection);
      toast.success(`Added ${pendingSelection.length} to group.`);
      load();
    } catch {
      toast.error('Failed to add members.');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <FiUsers className="h-4 w-4 text-primary-600" />
            <h3 className="font-display text-base font-bold text-ink-950">
              Mailing Groups
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          {/* Create new */}
          <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-500">
              Create New Group
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Group name (e.g., NITER Participants)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input-field !py-2.5 !text-sm"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="input-field !py-2.5 !text-sm"
              />
              <button
                onClick={handleCreate}
                disabled={creating}
                className="btn-primary w-full !py-2.5 !text-sm"
              >
                <FiPlus className="h-4 w-4" />
                {creating ? 'Creating...' : 'Create Group'}
              </button>
            </div>
            {pendingSelection && pendingSelection.length > 0 && (
              <p className="mt-2 text-xs text-primary-700">
                {pendingSelection.length} currently selected participant(s)
                will be added to this group.
              </p>
            )}
          </div>

          {/* List */}
          <div className="mt-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
              Existing Groups
            </p>
            {loading && (
              <p className="py-4 text-center text-sm text-ink-500">Loading...</p>
            )}
            {!loading && groups.length === 0 && (
              <p className="py-4 text-center text-sm text-ink-500">
                No groups yet.
              </p>
            )}
            {groups.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between rounded-xl border border-ink-100 bg-white p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {g.name}
                  </p>
                  <p className="text-xs text-ink-500">
                    {g.memberCount ?? 0} member
                    {(g.memberCount ?? 0) !== 1 ? 's' : ''}
                    {g.description ? ` · ${g.description}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {pendingSelection && pendingSelection.length > 0 && (
                    <button
                      onClick={() => handleAddSelectionTo(g.id)}
                      title="Add selection to this group"
                      className="rounded-md p-2 text-ink-500 hover:bg-primary-50 hover:text-primary-600"
                    >
                      <FiSave className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleUse(g.id)}
                    className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-50"
                  >
                    Use
                  </button>
                  <button
                    onClick={() => handleRename(g.id, g.name)}
                    title="Rename"
                    className="rounded-md p-2 text-ink-500 hover:bg-ink-100"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(g.id)}
                    title="Delete"
                    className="rounded-md p-2 text-red-500 hover:bg-red-50"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}