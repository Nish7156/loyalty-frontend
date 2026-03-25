import { useEffect, useState } from 'react';
import { partnersApi } from '../../lib/api';
import { normalizeIndianPhone, DEFAULT_PHONE_PREFIX } from '../../lib/phone';
import type { Partner } from '../../lib/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PhoneInput } from '../../components/PhoneInput';

export function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [industryType, setIndustryType] = useState('F&B');
  const [ownerPhone, setOwnerPhone] = useState(DEFAULT_PHONE_PREFIX);
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
      await partnersApi.create({ businessName, industryType, ownerPhone: normalizeIndianPhone(ownerPhone) });
      setBusinessName('');
      setOwnerPhone(DEFAULT_PHONE_PREFIX);
      setShowForm(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-sm md:text-base p-2" style={{ color: 'var(--t2)' }}>Loading…</p>;

  return (
    <div className="min-w-0">
      <h1 className="text-lg font-bold mb-3 md:text-2xl md:mb-4" style={{ color: 'var(--t)' }}>Stores</h1>
      {error && <p className="mb-2 text-sm" style={{ color: 'var(--re)' }}>{error}</p>}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="mb-3 md:mb-4 min-h-[44px] w-full sm:w-auto" style={{ background: 'var(--a)', color: 'var(--s)' }}>
          <span className="material-symbols-rounded mr-1" style={{ fontSize: '18px' }}>add</span>
          Add Store
        </Button>
      ) : (
        <form onSubmit={handleCreate} className="rounded-lg p-3 mb-3 md:p-4 md:mb-4 max-w-md w-full" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <Input
            label="Store Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
          <div className="mt-2">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t)' }}>Industry</label>
            <select
              value={industryType}
              onChange={(e) => setIndustryType(e.target.value)}
              className="w-full rounded-lg px-3 py-2"
              style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }}
            >
              <option value="F&B">F&B</option>
              <option value="Retail">Retail</option>
              <option value="Grocery">Grocery</option>
              <option value="Automotive">Automotive</option>
              <option value="Health & Wellness">Health & Wellness</option>
              <option value="Education">Education</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Food & Beverage">Food & Beverage</option>
              <option value="Gaming">Gaming</option>
              <option value="Hospitality">Hospitality</option>
              <option value="Retail">Retail</option>
              <option value="Technology">Technology</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="mt-2">
            <PhoneInput
              label="Owner Phone"
              value={ownerPhone}
              onChange={setOwnerPhone}
              placeholder="98765 43210"
              required
            />
            <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
              The owner will use this number to log in.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button type="submit" disabled={submitting} className="min-h-[44px] flex-1 sm:flex-none" style={{ background: 'var(--a)', color: 'var(--s)' }}>
              Create
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="min-h-[44px] flex-1 sm:flex-none" style={{ border: '1px solid var(--bd)', color: 'var(--t)' }}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full" style={{ borderColor: 'var(--bdl)' }}>
            <thead style={{ background: 'var(--bdl)' }}>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--t)' }}>Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--t)' }}>Industry</th>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--t)' }}>Owner Phone</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p, idx) => (
                <tr key={p.id} style={{ borderBottom: idx < partners.length - 1 ? '1px solid var(--bdl)' : 'none' }}>
                  <td className="px-4 py-2" style={{ color: 'var(--t)' }}>{p.businessName}</td>
                  <td className="px-4 py-2" style={{ color: 'var(--t2)' }}>{p.industryType}</td>
                  <td className="px-4 py-2" style={{ color: 'var(--t2)' }}>{p.owner?.phone ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="md:hidden">
          {partners.map((p, idx) => (
            <li key={p.id} className="p-3" style={{ borderBottom: idx < partners.length - 1 ? '1px solid var(--bdl)' : 'none' }}>
              <p className="font-medium" style={{ color: 'var(--t)' }}>{p.businessName}</p>
              <p className="text-sm" style={{ color: 'var(--t2)' }}>{p.industryType}</p>
              <p className="text-sm" style={{ color: 'var(--t3)' }}>{p.owner?.phone ?? '—'}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
