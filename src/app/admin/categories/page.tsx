'use client';

// ============================================================
// Admin → Categories
// Generate / regenerate / clear an AI cover image per category.
// Categories are the 9 canonical strings (not a DB table); images are
// stored in `category_images` keyed by slug. Mirrors the old course
// cover-image flow, now moved to categories.
// ============================================================

import { useCallback, useEffect, useState } from 'react';

type AdminCategory = {
  slug: string;
  nameKa: string;
  nameEn: string;
  icon: string;
  tone: string;
  imageUrl: string | null;
  bundlePriceCents: number | null;
  bundleRetailCents: number | null;
  courseCount: number;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (!res.ok) throw new Error('forbidden');
      const data = await res.json();
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchCategories().finally(() => setLoading(false));
  }, [fetchCategories]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-8 w-8 border-4 border-navy-100 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Each category is sold as a bundle. Set its cover image and bundle price — both show up on
          the landing-page category slider and the bundle checkout.
        </p>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => (
          <CategoryImageCard key={cat.slug} category={cat} onChange={fetchCategories} />
        ))}
      </div>
    </div>
  );
}

function CategoryImageCard({
  category,
  onChange,
}: {
  category: AdminCategory;
  onChange: () => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(category.imageUrl);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bundle price (edited in whole ₾, stored as tetri).
  const toGel = (cents: number | null) => (cents == null ? '' : String(cents / 100));
  const [price, setPrice] = useState(toGel(category.bundlePriceCents));
  const [retail, setRetail] = useState(toGel(category.bundleRetailCents));
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceSaved, setPriceSaved] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const savePrice = async () => {
    const toCents = (gel: string): number | null => {
      const t = gel.trim();
      if (t === '') return null;
      const n = Number(t);
      if (!Number.isFinite(n) || n < 0) return NaN as unknown as number;
      return Math.round(n * 100);
    };
    const priceC = toCents(price);
    const retailC = toCents(retail);
    if (Number.isNaN(priceC) || Number.isNaN(retailC)) {
      setPriceError('Enter valid numbers, or leave blank for the auto price.');
      return;
    }
    setSavingPrice(true);
    setPriceError(null);
    setPriceSaved(false);
    try {
      const res = await fetch(`/api/admin/categories/${category.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundlePriceCents: priceC, bundleRetailCents: retailC }),
      });
      if (!res.ok) throw new Error('save_failed');
      setPriceSaved(true);
      onChange();
      setTimeout(() => setPriceSaved(false), 2000);
    } catch {
      setPriceError('Save failed.');
    } finally {
      setSavingPrice(false);
    }
  };

  const fetchPrompt = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/categories/${category.slug}/generate-image`);
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.prompt === 'string') setPrompt(data.prompt);
    } catch {
      // non-fatal
    }
  }, [category.slug]);

  useEffect(() => {
    fetchPrompt();
  }, [fetchPrompt]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${category.slug}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'generation_failed');
        return;
      }
      if (typeof data.imageUrl === 'string') setImageUrl(data.imageUrl);
      if (typeof data.prompt === 'string') setPrompt(data.prompt);
      onChange();
    } catch {
      setError('network_error');
    } finally {
      setGenerating(false);
    }
  };

  const clear = async () => {
    try {
      await fetch(`/api/admin/categories/${category.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: null }),
      });
      setImageUrl(null);
      onChange();
    } catch (err) {
      console.error('Failed to clear category image:', err);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">{category.icon}</span>
          <span>
            {category.nameKa}
            <span className="ml-2 text-xs font-normal text-gray-400">{category.nameEn}</span>
          </span>
        </h2>
        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
          3:2 · Replicate · low
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-[280px_1fr] md:items-start">
        <div className="relative aspect-[3/2] w-full rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={`Cover for ${category.nameEn}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
              No cover yet
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">
              Image prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono leading-snug"
              placeholder="Describe the cover image…"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Auto-built from the category name and theme. Edit freely before generating.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-600">
              Failed to generate ({error}). Check REPLICATE_API_KEY and try again.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={generate}
              disabled={generating}
              className="px-4 py-2 text-sm bg-navy text-white rounded-lg hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {generating && (
                <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {generating ? 'Generating…' : imageUrl ? 'Regenerate' : 'Generate Image'}
            </button>
            {imageUrl && (
              <button
                onClick={clear}
                disabled={generating}
                className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Clear
              </button>
            )}
            <button
              onClick={fetchPrompt}
              disabled={generating}
              className="px-4 py-2 text-sm border text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Reset prompt
            </button>
          </div>
        </div>
      </div>

      {/* Bundle pricing */}
      <div className="mt-5 border-t border-gray-100 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Bundle price</h3>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {category.courseCount} {category.courseCount === 1 ? 'course' : 'courses'} in this
              bundle. Blank = auto-priced from catalog size.
            </p>
          </div>
          {priceSaved && <span className="text-xs font-medium text-teal">Saved ✓</span>}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[140px_140px_auto] sm:items-end">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">
              Bundle (₾)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Auto"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal-100"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">
              Retail (₾)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={retail}
              onChange={(e) => setRetail(e.target.value)}
              placeholder="Optional"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal-100"
            />
          </div>
          <button
            onClick={savePrice}
            disabled={savingPrice}
            className="px-4 py-2 text-sm bg-navy text-white rounded-lg hover:bg-navy-light disabled:bg-gray-300"
          >
            {savingPrice ? 'Saving…' : 'Save price'}
          </button>
        </div>
        {priceError && <p className="mt-2 text-xs text-red-600">{priceError}</p>}
      </div>
    </div>
  );
}
