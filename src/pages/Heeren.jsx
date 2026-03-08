// src/pages/Heeren.jsx
import React, { useMemo, useState } from 'react';

export default function Heeren() {
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState(new Set());
  const [sort, setSort] = useState('popular');
  const [sizeSel, setSizeSel] = useState(new Set());
  const [colorSel, setColorSel] = useState(new Set());

  const brands = [
    { name: 'Nike', count: 123 },
    { name: 'Adidas', count: 55 },
    { name: 'Apple', count: 65 },
    { name: 'New Balance', count: 99 },
    { name: 'Puma', count: 35 },
    { name: 'Uniqlo', count: 61 },
  ];

  const allSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const allColors = [
    '#111827',
    '#6b7280',
    '#e5e7eb',
    '#f59e0b',
    '#ef4444',
    '#10b981',
    '#3b82f6',
    '#a78bfa',
  ];

  const products = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i + 1,
        brand: ['Nike', 'Adidas', 'Uniqlo', 'Puma'][i % 4],
        title: ['Shirt Soft Cotton', 'Zip Up Neck Shirt', 'Classic Long Sleeve'][i % 3],
        price: 40,
        badge: i % 2 === 0 ? 'New Arrival' : null,
        img: `https://picsum.photos/seed/heeren${i}/450/560`,
        sizes: ['S', 'M', 'L', 'XL'].slice(0, (i % 4) + 1),
        color: allColors[i % allColors.length],
      })),
    []
  );

  const filtered = products
    .filter((p) => {
      const q = search.trim().toLowerCase();
      const matchQ = !q || p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
      const matchBrand = brandFilter.size === 0 || brandFilter.has(p.brand);
      const matchSize = sizeSel.size === 0 || p.sizes.some((s) => sizeSel.has(s));
      const matchColor = colorSel.size === 0 || colorSel.has(p.color);
      return matchQ && matchBrand && matchSize && matchColor;
    })
    .sort((a, b) => (sort === 'price' ? a.price - b.price : a.id - b.id));

  const toggle = (set) => (val) =>
    set((prev) => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });

  return (
    <div className="mx-auto max-w-7xl">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1800&auto=format&fit=crop"
          alt="hero"
          className="w-full h-56 sm:h-64 md:h-72 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/70 to-white/10" />
        <div className="absolute left-6 top-1/2 -translate-y-1/2">
          <div className="text-4xl md:text-5xl font-semibold text-gray-900">
            Simple
            <br />
            is More
          </div>
        </div>
      </div>

      {/* Breadcrumb + sort */}
      <div className="px-2 sm:px-0 mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-500">Home &gt; Clothes</div>
        <div className="flex items-center gap-2 text-sm">
          <span>Sort by:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border rounded-lg px-2 py-1"
          >
            <option value="popular">Popular</option>
            <option value="price">Price</option>
          </select>
        </div>
      </div>

      {/* Main grid */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Filters */}
        <aside className="lg:col-span-3 rounded-2xl border shadow-sm bg-white p-4 h-fit">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-medium">Filter</div>
            <button className="text-sm text-blue-600">Advanced</button>
          </div>

          {/* Brand */}
          <div className="mt-3">
            <div className="text-sm font-medium mb-2">Brand</div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand..."
              className="w-full px-3 py-2 rounded-lg border"
            />
            <div className="mt-2 max-h-40 overflow-auto space-y-2">
              {brands.map((b) => (
                <label key={b.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={brandFilter.has(b.name)}
                      onChange={() => toggle(setBrandFilter)(b.name)}
                    />
                    <span>{b.name}</span>
                  </div>
                  <span className="text-gray-400">{b.count}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price (mock) */}
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Price</div>
            <input type="range" min={0} max={300} className="w-full" />
            <div className="mt-2 flex items-center gap-2">
              <input className="w-1/2 px-2 py-1 border rounded-lg" defaultValue={29} />
              <input className="w-1/2 px-2 py-1 border rounded-lg" defaultValue={300} />
            </div>
          </div>

          {/* Size */}
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Size</div>
            <div className="flex flex-wrap gap-2">
              {allSizes.map((s) => (
                <button
                  key={s}
                  onClick={() => toggle(setSizeSel)(s)}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${sizeSel.has(s) ? 'bg-gray-900 text-white' : 'bg-white hover:bg-gray-50'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Color</div>
            <div className="flex flex-wrap gap-2">
              {allColors.map((c) => (
                <button
                  key={c}
                  onClick={() => toggle(setColorSel)(c)}
                  className={`w-6 h-6 rounded-full border ${colorSel.has(c) ? 'ring-2 ring-offset-2 ring-gray-900' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Products */}
        <section className="lg:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <div key={p.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="relative">
                  {p.badge && (
                    <span className="absolute left-3 top-3 text-[10px] px-2 py-1 rounded-full bg-teal-500 text-white">
                      {p.badge}
                    </span>
                  )}
                  <img src={p.img} alt={p.title} className="w-full aspect-[3/4] object-cover" />
                </div>
                <div className="p-4">
                  <div className="text-xs text-gray-500">{p.brand}</div>
                  <div className="font-medium">{p.title}</div>
                  <div className="mt-1 text-blue-600 font-semibold">SAR {p.price.toFixed(2)}</div>
                  <div className="mt-2 flex items-center justify-between text-xs text-red-500">
                    <span>12 items left!</span>
                    <button className="text-gray-400 hover:text-gray-600">♡</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
