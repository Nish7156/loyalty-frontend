import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { partnersApi, staffApi, branchesApi } from '../../lib/api';
import { normalizeIndianPhone, DEFAULT_PHONE_PREFIX } from '../../lib/phone';
import type { Partner } from '../../lib/api';
import type { Staff } from '../../lib/api';
import type { Branch } from '../../lib/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PhoneInput } from '../../components/PhoneInput';

export function StaffPage() {
  const { auth } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(DEFAULT_PHONE_PREFIX);
  const [branchId, setBranchId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const myPartners = auth.type === 'platform' ? partners.filter((p) => p.ownerId === auth.user.id) : partners;
  const myBranches = branches.filter((b) => myPartners.some((p) => p.id === b.partnerId));
  const branchesForStaff = auth.type === 'platform' ? branches : myBranches;
  const staffList = Array.isArray(staff) ? staff : [];
  const myStaff = staffList.filter((s) => branchesForStaff.some((b) => b.id === s.branchId));

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([partnersApi.list(), branchesApi.list(), staffApi.list()])
      .then(([p, b, s]) => {
        setPartners(Array.isArray(p) ? p : []);
        setBranches(Array.isArray(b) ? b : []);
        setStaff(Array.isArray(s) ? s : []);
        if (!branchId && Array.isArray(b) && b.length) setBranchId(b[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await staffApi.create({ name, phone: normalizeIndianPhone(phone), branchId });
      setName('');
      setPhone(DEFAULT_PHONE_PREFIX);
      setShowForm(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-sm md:text-base p-2">Loading…</p>;

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Management</h1>
          <p className="text-gray-600">Manage your team members and their access</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="min-h-[44px] bg-indigo-600 hover:bg-indigo-500">
            <span className="text-lg mr-2">+</span> Add Staff
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Add New Staff Member</h2>
          <form onSubmit={handleCreate} className="max-w-2xl">
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full"
              />
              <PhoneInput
                label="Phone Number"
                value={phone}
                onChange={setPhone}
                placeholder="98765 43210"
                required
              />
            </div>

            <p className="text-xs text-gray-500 mt-2 mb-6 flex items-center gap-1.5">
              <span className="text-indigo-600">💡</span>
              Staff will log in using this phone number via OTP
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="">Select a branch</option>
                {myBranches.map((b) => (
                  <option key={b.id} value={b.id}>{b.branchName}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting} className="min-h-[44px] bg-indigo-600 hover:bg-indigo-500">
                {submitting ? 'Creating...' : 'Create Staff'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="min-h-[44px]">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {myStaff.length === 0 && !showForm ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-gray-500 text-lg font-medium mb-2">No staff members yet</p>
          <p className="text-gray-400 text-sm">Add your first staff member to get started</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Staff Member</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone Number</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myStaff.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">{s.phone}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200/50">
                        📍 {branchesForStaff.find((b) => b.id === s.branchId)?.branchName ?? s.branch?.branchName ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200/50">
                        ✓ Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {myStaff.map((s) => (
              <div key={s.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-base mb-1">{s.name}</p>
                    <p className="text-sm text-gray-600 font-mono mb-3">{s.phone}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200/50">
                        📍 {branchesForStaff.find((b) => b.id === s.branchId)?.branchName ?? s.branch?.branchName ?? '—'}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200/50">
                        ✓ Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer with count */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Total Staff: <span className="font-semibold text-gray-900">{myStaff.length}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
