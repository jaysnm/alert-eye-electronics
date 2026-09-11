import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategoryBySlug } from '@/lib/queries'
import { ProductBrowser } from '@/components/shop/ProductBrowser'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const cat = await getCategoryBySlug(category)
  return { title: cat?.name ?? 'Shop' }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ category }, sp] = await Promise.all([params, searchParams])
  const cat = await getCategoryBySlug(category)
  if (!cat) notFound()
  return <ProductBrowser searchParams={sp} category={cat} heading={cat.name} />
}
