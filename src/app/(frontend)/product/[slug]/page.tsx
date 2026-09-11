import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ShieldCheck, Truck, MessageCircle } from 'lucide-react'
import { getProductBySlug, getRelatedProducts, getSiteSettings } from '@/lib/queries'
import { PriceTag } from '@/components/shop/PriceTag'
import { AddToCartButton } from '@/components/shop/AddToCartButton'
import { ProductGallery } from '@/components/shop/ProductGallery'
import { ProductGrid } from '@/components/shop/ProductCard'
import { RichText } from '@/components/site/RichText'
import { pickImage } from '@/components/shop/ProductImage'
import { waLink } from '@/lib/format'
import type { Category, Media } from '@/payload-types'

export const revalidate = 120

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product not found' }
  const img = pickImage(product.images?.[0]?.image, 'og')
  return {
    title: product.title,
    description: product.shortDescription ?? undefined,
    openGraph: img ? { images: [img.url] } : undefined,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const settings = await getSiteSettings()
  const categoryIds = (product.category ?? [])
    .map((c) => (typeof c === 'object' ? c.id : c))
    .filter(Boolean) as number[]
  const related = await getRelatedProducts(categoryIds, product.id)

  const images = (product.images ?? [])
    .map((i) => pickImage(i.image as number | Media, 'feature'))
    .filter(Boolean) as { url: string; alt: string }[]

  const cats = (product.category ?? []).filter((c): c is Category => typeof c === 'object')
  const soldOut = (product.stockQty ?? 0) <= 0

  return (
    <div className="container-page py-6">
      <nav className="text-xs text-slate-500 mb-4">
        <Link href="/" className="hover:underline">Home</Link> / <Link href="/shop" className="hover:underline">Shop</Link>
        {cats[0] && (
          <> / <Link href={`/shop/${cats[0].slug}`} className="hover:underline">{cats[0].name}</Link></>
        )}
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        <ProductGallery images={images} />

        <div>
          <h1 className="text-2xl font-bold text-navy-900">{product.title}</h1>
          {product.sku && <p className="text-xs text-slate-400 mt-1">SKU: {product.sku}</p>}

          <div className="mt-4">
            <PriceTag price={product.priceKES} compareAt={product.compareAtPriceKES} size="lg" />
          </div>

          <p className={`mt-2 text-sm font-medium ${soldOut ? 'text-red-600' : 'text-green-600'}`}>
            {soldOut ? 'Out of stock' : product.lowStock ? `Only ${product.stockQty} left` : 'In stock'}
          </p>

          {product.shortDescription && (
            <p className="mt-4 text-slate-600">{product.shortDescription}</p>
          )}

          <div className="mt-6 max-w-sm">
            <AddToCartButton
              withQty
              label="Add to cart"
              item={{
                productId: product.id,
                slug: product.slug || String(product.id),
                title: product.title,
                priceKES: product.priceKES,
                image: images[0]?.url ?? null,
                maxQty: product.stockQty ?? 0,
              }}
            />
          </div>

          {settings.whatsapp && (
            <a
              href={waLink(settings.whatsapp, `Hi, I'm interested in "${product.title}" (${product.slug})`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#128C7E]"
            >
              <MessageCircle size={16} /> Enquire on WhatsApp
            </a>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
              <Truck size={18} className="text-navy-700" /> Countrywide delivery
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
              <ShieldCheck size={18} className="text-navy-700" />
              {product.warranty || 'Genuine products'}
            </div>
          </div>

          {product.specs && product.specs.length > 0 && (
            <div className="mt-8">
              <h2 className="font-semibold text-navy-900 mb-2">Specifications</h2>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {product.specs.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4 text-slate-500 w-1/3">{s.label}</td>
                      <td className="py-2 text-slate-800">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {product.description && (
        <div className="mt-12 max-w-3xl">
          <h2 className="text-xl font-bold text-navy-900 mb-3">Description</h2>
          <RichText data={product.description} />
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="text-xl font-bold text-navy-900 mb-5">Related products</h2>
          <ProductGrid products={related} />
        </div>
      )}
    </div>
  )
}
