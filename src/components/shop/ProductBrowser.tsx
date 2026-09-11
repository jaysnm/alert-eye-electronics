import Link from 'next/link'
import { getBrands, getNavCategories, getProducts } from '@/lib/queries'
import { ProductGrid } from './ProductCard'
import type { Category } from '@/payload-types'

type SearchParams = Record<string, string | string[] | undefined>

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
]

export const ProductBrowser = async ({
  searchParams,
  category,
  heading,
}: {
  searchParams: SearchParams
  category?: Category | null
  heading: string
}) => {
  const q = str(searchParams.q)
  const sort = str(searchParams.sort) ?? 'newest'
  const brandSlug = str(searchParams.brand)
  const page = Math.max(1, Number(str(searchParams.page) ?? '1') || 1)
  const inStock = str(searchParams.inStock) === '1'

  const [{ docs, totalPages, totalDocs }, brands, navCategories] = await Promise.all([
    getProducts({
      q,
      sort,
      brandSlug,
      page,
      inStock,
      categoryId: category?.id,
      limit: 24,
    }),
    getBrands(),
    getNavCategories(),
  ])

  const base = category ? `/shop/${category.slug}` : '/shop'
  const buildQuery = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams()
    const merged = { q, sort, brand: brandSlug, inStock: inStock ? '1' : undefined, ...patch }
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v)
    const s = sp.toString()
    return s ? `${base}?${s}` : base
  }

  return (
    <div className="container-page py-6">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:underline">Home</Link> / <Link href="/shop" className="hover:underline">Shop</Link>
        {category && <> / <span className="text-slate-700">{category.name}</span></>}
      </nav>

      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-5">
        <h1 className="text-2xl font-bold text-navy-900">
          {q ? `Search: "${q}"` : heading}
        </h1>
        <p className="text-sm text-slate-500">{totalDocs} product{totalDocs === 1 ? '' : 's'}</p>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <aside className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-navy-900 mb-2">Categories</h2>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/shop" className={!category ? 'font-semibold text-navy-900' : 'text-slate-600 hover:underline'}>
                  All products
                </Link>
              </li>
              {navCategories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/shop/${c.slug}`}
                    className={category?.id === c.id ? 'font-semibold text-navy-900' : 'text-slate-600 hover:underline'}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {brands.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-navy-900 mb-2">Brands</h2>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link href={buildQuery({ brand: undefined, page: undefined })} className={!brandSlug ? 'font-semibold text-navy-900' : 'text-slate-600 hover:underline'}>
                    All brands
                  </Link>
                </li>
                {brands.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={buildQuery({ brand: b.slug ?? undefined, page: undefined })}
                      className={brandSlug === b.slug ? 'font-semibold text-navy-900' : 'text-slate-600 hover:underline'}
                    >
                      {b.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            href={buildQuery({ inStock: inStock ? undefined : '1', page: undefined })}
            className={`inline-flex items-center gap-2 text-sm ${inStock ? 'font-semibold text-navy-900' : 'text-slate-600'}`}
          >
            <span className={`h-4 w-4 rounded border ${inStock ? 'bg-navy-900 border-navy-900' : 'border-slate-400'}`} />
            In stock only
          </Link>
        </aside>

        <div>
          <div className="flex justify-end mb-4">
            <div className="flex gap-1 text-xs">
              {SORTS.map((s) => (
                <Link
                  key={s.value}
                  href={buildQuery({ sort: s.value, page: undefined })}
                  className={`rounded-full px-3 py-1.5 border ${
                    sort === s.value ? 'bg-navy-900 text-white border-navy-900' : 'border-slate-300 text-slate-600'
                  }`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          {docs.length === 0 ? (
            <p className="text-slate-500 py-16 text-center">No products match your filters.</p>
          ) : (
            <ProductGrid products={docs} />
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-1 mt-8 text-sm">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildQuery({ page: p === 1 ? undefined : String(p) })}
                  className={`rounded px-3 py-1.5 border ${
                    p === page ? 'bg-navy-900 text-white border-navy-900' : 'border-slate-300 text-slate-600'
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
