import { useEffect, useState } from 'react';
import { partnersApi } from '../../lib/api';
import type { Partner } from '../../lib/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [industryType, setIndustryType] = useState('F&B');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    partnersApi
      .list()
      .then(setPartners)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await partnersApi.create({ businessName, industryType, ownerPhone });
      setBusinessName('');
      setOwnerPhone('');
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
      <h1 className="text-2xl font-bold mb-4">Stores</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="mb-4">
          Add Store
        </Button>
      ) : (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-4 mb-4 max-w-md">
          <Input
            label="Store Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <select
              value={industryType}
              onChange={(e) => setIndustryType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="F&B">F&B</option>
              <option value="Salon">Salon</option>
              <option value="Fitness">Fitness</option>
            </select>
          </div>
          <div className="mt-2">
            <Input
              label="Owner Phone"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              placeholder="+15550001234"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The owner will use this number to log in.
            </p>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" disabled={submitting}>
              Create
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Industry</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Owner Phone</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {partners.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2">{p.businessName}</td>
                <td className="px-4 py-2">{p.industryType}</td>
                <td className="px-4 py-2">{p.owner?.phone ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
