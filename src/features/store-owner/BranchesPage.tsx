import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { partnersApi, branchesApi } from '../../lib/api';
import type { Partner } from '../../lib/api';
import type { Branch } from '../../lib/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export function BranchesPage() {
  const { auth } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const myPartners = auth.type === 'platform' ? partners.filter((p) => p.ownerId === auth.user.id) : partners;

  const load = () => {
    setLoading(true);
    Promise.all([partnersApi.list(), branchesApi.list()])
      .then(([p, b]) => {
        setPartners(p);
        setBranches(b);
        if (!partnerId && p.length) setPartnerId(p[0].id);
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
      await branchesApi.create({ branchName, partnerId });
      setBranchName('');
      setShowForm(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Branches</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="mb-4">
          Add Branch
        </Button>
      ) : (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-4 mb-4 max-w-md">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Partner</label>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              {myPartners.map((p) => (
                <option key={p.id} value={p.id}>{p.businessName}</option>
              ))}
            </select>
          </div>
          <Input
            label="Branch Name"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            required
          />
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
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Branch</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Partner</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {branches
              .filter((b) => myPartners.some((p) => p.id === b.partnerId))
              .map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2">{b.branchName}</td>
                  <td className="px-4 py-2">{partners.find((p) => p.id === b.partnerId)?.businessName}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
