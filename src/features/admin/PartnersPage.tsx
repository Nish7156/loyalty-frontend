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

  if (loading) return <p className="text-sm md:text-base p-2">Loading…</p>;

  return (
    <div className="min-w-0">
      <h1 className="text-lg font-bold mb-3 md:text-2xl md:mb-4">Stores</h1>
      {error && <p className="text-red-600 mb-2 text-sm">{error}</p>}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="mb-3 md:mb-4 min-h-[44px] w-full sm:w-auto">
          Add Store
        </Button>
      ) : (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-3 mb-3 md:p-4 md:mb-4 max-w-md w-full">
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
              placeholder="+91 98765 43210"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The owner will use this number to log in.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button type="submit" disabled={submitting} className="min-h-[44px] flex-1 sm:flex-none">
              Create
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="min-h-[44px] flex-1 sm:flex-none">
              Cancel
            </Button>
          </div>
        </form>
      )}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
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
        <ul className="md:hidden divide-y divide-gray-200">
          {partners.map((p) => (
            <li key={p.id} className="p-3">
              <p className="font-medium">{p.businessName}</p>
              <p className="text-sm text-gray-600">{p.industryType}</p>
              <p className="text-sm text-gray-500">{p.owner?.phone ?? '—'}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
