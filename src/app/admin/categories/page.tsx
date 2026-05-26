'use client';

// ============================================================
// Admin → Categories
// Generate / regenerate / clear an AI cover image per category.
// Categories are the 9 canonical strings (not a DB table); images are
// stored in `category_images` keyed by slug. Mirrors the old course
// cover-image flow, now moved to categories.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type AdminCategory = {
  slug: string;
  nameKa: string;
  nameEn: string;
  icon: string;
  tone: string;
  imageUrl: string | null;
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
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
          &larr; Back to Admin
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Category Cover Images</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Generate one AI cover image per category. Shown on the landing-page category slider and
            section headers.
          </p>
        </div>

        <div className="space-y-4">
          {categories.map((cat) => (
            <CategoryImageCard key={cat.slug} category={cat} onChange={fetchCategories} />
          ))}
        </div>
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
    </div>
  );
}
