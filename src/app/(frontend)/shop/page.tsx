import type { Metadata } from 'next'
import { ProductBrowser } from '@/components/shop/ProductBrowser'

export const metadata: Metadata = { title: 'Shop' }
export const revalidate = 60

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  return <ProductBrowser searchParams={sp} heading="All products" />
}
