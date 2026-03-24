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

  if (loading) return <p className="text-sm md:text-base p-2" style={{ color: '#7B5E54' }}>Loading…</p>;

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6" style={{ background: '#FAF9F6' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#5D4037' }}>Staff Management</h1>
          <p style={{ color: '#7B5E54' }}>Manage your team members and their access</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="min-h-[44px]" style={{ background: '#D85A30', color: '#FFF' }}>
            <span className="material-symbols-rounded mr-1" style={{ fontSize: '20px' }}>add</span> Add Staff
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm" style={{ background: '#FDEEE9', border: '1px solid #F5C4B3', color: '#B03A2A' }}>
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 rounded-2xl p-6" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#5D4037' }}>Add New Staff Member</h2>
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

            <p className="text-xs mt-2 mb-6 flex items-center gap-1.5" style={{ color: '#A08880' }}>
              <span className="material-symbols-rounded" style={{ color: '#D85A30', fontSize: '16px' }}>lightbulb</span>
              Staff will log in using this phone number via OTP
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: '#5D4037' }}>Assign to Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2"
                style={{ border: '1px solid #F5C4B3', color: '#5D4037', background: '#FFF' }}
                required
              >
                <option value="">Select a branch</option>
                {myBranches.map((b) => (
                  <option key={b.id} value={b.id}>{b.branchName}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting} className="min-h-[44px]" style={{ background: '#D85A30', color: '#FFF' }}>
                {submitting ? 'Creating...' : 'Create Staff'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="min-h-[44px]" style={{ border: '1px solid #F5C4B3', color: '#5D4037' }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {myStaff.length === 0 && !showForm ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: '#FFF', border: '1px solid #FAECE7' }}>
          <span className="material-symbols-rounded" style={{ fontSize: '64px', color: '#A08880' }}>group</span>
          <p className="text-lg font-medium mb-2" style={{ color: '#7B5E54' }}>No staff members yet</p>
          <p className="text-sm" style={{ color: '#A08880' }}>Add your first staff member to get started</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ background: '#FAECE7' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4037' }}>Staff Member</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4037' }}>Phone Number</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4037' }}>Branch</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4037' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {myStaff.map((s, idx) => (
                  <tr key={s.id} className="transition-colors" style={{ borderBottom: idx < myStaff.length - 1 ? '1px solid #FAECE7' : 'none' }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ background: 'linear-gradient(135deg, #D85A30, #E8784E)' }}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium" style={{ color: '#5D4037' }}>{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm" style={{ color: '#7B5E54' }}>{s.phone}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#FAECE7', color: '#D85A30', border: '1px solid #F5C4B3' }}>
                        <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '12px' }}>location_on</span>
                        {branchesForStaff.find((b) => b.id === s.branchId)?.branchName ?? s.branch?.branchName ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#E4F2EB', color: '#2A6040', border: '1px solid rgba(42,96,64,0.2)' }}>
                        <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '12px' }}>check</span> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {myStaff.map((s, idx) => (
              <div key={s.id} className="p-4 transition-colors" style={{ borderBottom: idx < myStaff.length - 1 ? '1px solid #FAECE7' : 'none' }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shrink-0" style={{ background: 'linear-gradient(135deg, #D85A30, #E8784E)' }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base mb-1" style={{ color: '#5D4037' }}>{s.name}</p>
                    <p className="text-sm font-mono mb-3" style={{ color: '#7B5E54' }}>{s.phone}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#FAECE7', color: '#D85A30', border: '1px solid #F5C4B3' }}>
                        <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '12px' }}>location_on</span>
                        {branchesForStaff.find((b) => b.id === s.branchId)?.branchName ?? s.branch?.branchName ?? '—'}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#E4F2EB', color: '#2A6040', border: '1px solid rgba(42,96,64,0.2)' }}>
                        <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '12px' }}>check</span> Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer with count */}
          <div className="px-6 py-4" style={{ background: '#FAECE7', borderTop: '1px solid #F5C4B3' }}>
            <p className="text-sm" style={{ color: '#7B5E54' }}>
              Total Staff: <span className="font-semibold" style={{ color: '#5D4037' }}>{myStaff.length}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
