import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { partnersApi, staffApi, branchesApi } from '../../lib/api';
import type { Partner } from '../../lib/api';
import type { Staff } from '../../lib/api';
import type { Branch } from '../../lib/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export function StaffPage() {
  const { auth } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [branchId, setBranchId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const myPartners = auth.type === 'platform' ? partners.filter((p) => p.ownerId === auth.user.id) : partners;
  const myBranches = branches.filter((b) => myPartners.some((p) => p.id === b.partnerId));
  // For platform (owner), backend already returns only their branches; use branches so staff list isn't empty if partners filter mismatches
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
      await staffApi.create({ name, phone, branchId });
      setName('');
      setPhone('');
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
    <div className="min-w-0">
      <h1 className="text-lg font-bold mb-3 md:text-2xl md:mb-4">Staff</h1>
      {error && <p className="text-red-600 mb-2 text-sm">{error}</p>}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="mb-3 md:mb-4 min-h-[44px] w-full sm:w-auto">
          Add Staff
        </Button>
      ) : (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-3 mb-3 md:p-4 md:mb-4 max-w-md w-full">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required className="mt-2" />
          <p className="text-xs text-gray-500 mt-1">Seller will log in using this phone via OTP.</p>
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" required>
              {myBranches.map((b) => (
                <option key={b.id} value={b.id}>{b.branchName}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button type="submit" disabled={submitting} className="min-h-[44px] flex-1 sm:flex-none">Create</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="min-h-[44px] flex-1 sm:flex-none">Cancel</Button>
          </div>
        </form>
      )}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Phone</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Branch</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {myStaff.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.phone}</td>
                  <td className="px-4 py-2">{branchesForStaff.find((b) => b.id === s.branchId)?.branchName ?? s.branch?.branchName ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="md:hidden divide-y divide-gray-200">
          {myStaff.map((s) => (
            <li key={s.id} className="p-3">
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-gray-600">{s.phone}</p>
              <p className="text-sm text-gray-500">{branchesForStaff.find((b) => b.id === s.branchId)?.branchName ?? s.branch?.branchName ?? '—'}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
