import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const initialInvite = {
  email: '',
  full_name: '',
  role: 'staff'
};

export default function TeamPage() {
  const auth = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invite, setInvite] = useState(initialInvite);
  const [inviteStatus, setInviteStatus] = useState({ loading: false, error: '', message: '' });

  const me = auth.user;

  const currentUserId = useMemo(() => me?.id || null, [me]);

  const loadTeam = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api.staff();
      setTeam(result.data || []);
    } catch (err) {
      setTeam([]);
      setError(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const updateInvite = (key) => (event) => {
    setInvite((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const submitInvite = async (event) => {
    event.preventDefault();
    setInviteStatus({ loading: true, error: '', message: '' });

    try {
      const result = await api.inviteStaff(invite);
      setInviteStatus({
        loading: false,
        error: '',
        message: result.message || 'Invitation sent.'
      });
      setInvite(initialInvite);
      await loadTeam();
    } catch (err) {
      setInviteStatus({ loading: false, error: err.message || 'Invite failed', message: '' });
    }
  };

  const updateRole = async (id, role) => {
    try {
      await api.updateStaffRole(id, role);
      await loadTeam();
    } catch (_err) {
      // Keep UI state unchanged if update fails.
    }
  };

  const removeMember = async (id) => {
    try {
      await api.removeStaff(id);
      await loadTeam();
    } catch (_err) {
      // Keep UI state unchanged if delete fails.
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Team</h1>
      <p className="mt-2 text-sm text-neutral-400">Manage tenant staff members and admin roles.</p>

      <form className="mt-6 grid gap-3 rounded-lg border border-neutral-750 bg-neutral-800 p-4 md:grid-cols-3" onSubmit={submitInvite}>
        <Field label="Email" type="email" value={invite.email} onChange={updateInvite('email')} required />
        <Field label="Full name" value={invite.full_name} onChange={updateInvite('full_name')} />
        <label className="block text-sm text-neutral-200">
          <span>Role</span>
          <select
            className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2"
            value={invite.role}
            onChange={updateInvite('role')}
          >
            <option value="staff">staff</option>
            <option value="admin">admin</option>
          </select>
        </label>

        {inviteStatus.error ? <p className="text-sm text-danger-500 md:col-span-3">{inviteStatus.error}</p> : null}
        {inviteStatus.message ? <p className="text-sm text-success-500 md:col-span-3">{inviteStatus.message}</p> : null}

        <div className="md:col-span-3">
          <button
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600 disabled:opacity-60"
            disabled={inviteStatus.loading}
            type="submit"
          >
            {inviteStatus.loading ? 'Sending invite...' : 'Invite team member'}
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-750">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-800 text-neutral-200">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-neutral-400" colSpan="4">Loading team...</td>
              </tr>
            ) : null}

            {!loading && error ? (
              <tr>
                <td className="px-4 py-6 text-danger-500" colSpan="4">{error}</td>
              </tr>
            ) : null}

            {!loading && !error
              ? team.map((member) => {
                  const isSelf = currentUserId && currentUserId === member.id;
                  return (
                    <tr key={member.id} className="border-t border-neutral-750 bg-neutral-900">
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-100">{member.full_name || 'Unnamed user'}</p>
                        <p className="text-xs text-neutral-400">{member.email || member.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="rounded-md border border-neutral-750 bg-neutral-950 px-2 py-1 capitalize"
                          value={member.role}
                          onChange={(event) => updateRole(member.id, event.target.value)}
                        >
                          <option value="staff">staff</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-neutral-300">{new Date(member.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button
                          className="rounded border border-neutral-750 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
                          disabled={Boolean(isSelf)}
                          onClick={() => removeMember(member.id)}
                          type="button"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })
              : null}

            {!loading && !error && team.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-neutral-400" colSpan="4">No team members found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block text-sm text-neutral-200">
      <span>{label}</span>
      <input className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2" {...props} />
    </label>
  );
}
