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
  const [password, setPassword] = useState('');
  const [branchId, setBranchId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const myPartners = auth.type === 'platform' ? partners.filter((p) => p.ownerId === auth.user.id) : partners;
  const myBranches = branches.filter((b) => myPartners.some((p) => p.id === b.partnerId));

  const load = () => {
    setLoading(true);
    Promise.all([partnersApi.list(), branchesApi.list(), staffApi.list()])
      .then(([p, b, s]) => {
        setPartners(p);
        setBranches(b);
        setStaff(s);
        if (!branchId && b.length) setBranchId(b[0].id);
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
      await staffApi.create({ name, phone, password, branchId });
      setName('');
      setPhone('');
      setPassword('');
      setShowForm(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const myStaff = staff.filter((s) => myBranches.some((b) => b.id === s.branchId));

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Staff</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="mb-4">
          Add Staff
        </Button>
      ) : (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-4 mb-4 max-w-md">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-2" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-2" />
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" required>
              {myBranches.map((b) => (
                <option key={b.id} value={b.id}>{b.branchName}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" disabled={submitting}>Create</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                <td className="px-4 py-2">{branches.find((b) => b.id === s.branchId)?.branchName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
