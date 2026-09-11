import 'server-only'
import { cache } from 'react'
import type { Where } from 'payload'
import { getPayload } from './payload'

export const getSiteSettings = cache(async () => {
  const payload = await getPayload()
  return payload.findGlobal({ slug: 'site-settings', depth: 1 })
})

export const getHomepage = cache(async () => {
  const payload = await getPayload()
  return payload.findGlobal({ slug: 'homepage', depth: 2 })
})

export const getNavCategories = cache(async () => {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { showInNav: { equals: true } },
    sort: 'navOrder',
    limit: 100,
    depth: 1,
  })
  return docs
})

export const getCategoryBySlug = cache(async (slug: string) => {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
})

export const getBrands = cache(async () => {
  const payload = await getPayload()
  const { docs } = await payload.find({ collection: 'brands', limit: 100, sort: 'name' })
  return docs
})

type ProductQuery = {
  categoryId?: string | number
  brandSlug?: string
  q?: string
  sort?: string
  page?: number
  limit?: number
  featured?: boolean
  inStock?: boolean
  minPrice?: number
  maxPrice?: number
}

const SORT_MAP: Record<string, string> = {
  newest: '-createdAt',
  'price-asc': 'priceKES',
  'price-desc': '-priceKES',
  name: 'title',
}

export const getProducts = async (opts: ProductQuery = {}) => {
  const payload = await getPayload()
  const and: Where[] = [{ status: { equals: 'active' } }]

  if (opts.categoryId) and.push({ category: { in: [opts.categoryId] } })
  if (opts.brandSlug) and.push({ 'brand.slug': { equals: opts.brandSlug } })
  if (opts.featured) and.push({ featured: { equals: true } })
  if (opts.inStock) and.push({ stockQty: { greater_than: 0 } })
  if (typeof opts.minPrice === 'number') and.push({ priceKES: { greater_than_equal: opts.minPrice } })
  if (typeof opts.maxPrice === 'number') and.push({ priceKES: { less_than_equal: opts.maxPrice } })
  if (opts.q) {
    and.push({
      or: [
        { title: { like: opts.q } },
        { shortDescription: { like: opts.q } },
        { sku: { like: opts.q } },
      ],
    })
  }

  return payload.find({
    collection: 'products',
    where: { and },
    sort: SORT_MAP[opts.sort ?? 'newest'] ?? '-createdAt',
    page: opts.page ?? 1,
    limit: opts.limit ?? 24,
    depth: 1,
  })
}

export const getProductBySlug = cache(async (slug: string) => {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'products',
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'active' } }] },
    limit: 1,
    depth: 2,
  })
  return docs[0] ?? null
})

export const getRelatedProducts = async (categoryIds: (string | number)[], excludeId: string | number) => {
  if (categoryIds.length === 0) return []
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'products',
    where: {
      and: [
        { status: { equals: 'active' } },
        { category: { in: categoryIds } },
        { id: { not_equals: excludeId } },
      ],
    },
    limit: 4,
    depth: 1,
  })
  return docs
}

export const getServiceTypes = cache(async () => {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'service-types',
    where: { active: { equals: true } },
    sort: 'displayOrder',
    limit: 100,
    depth: 1,
  })
  return docs
})

export const getServiceTypeBySlug = cache(async (slug: string) => {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'service-types',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
})

export const getPageBySlug = cache(async (slug: string) => {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  return docs[0] ?? null
})
