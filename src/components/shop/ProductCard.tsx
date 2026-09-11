import Link from 'next/link'
import type { Product } from '@/payload-types'
import { PriceTag } from './PriceTag'
import { AddToCartButton } from './AddToCartButton'
import { ProductImage, firstProductImage } from './ProductImage'

export const ProductCard = ({ product }: { product: Product }) => {
  const img = firstProductImage(product, 'card')
  const soldOut = (product.stockQty ?? 0) <= 0

  return (
    <div className="group flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/product/${product.slug}`} className="relative aspect-square bg-white p-3">
        <ProductImage src={img} className="p-3" />
        {soldOut && (
          <span className="absolute top-2 left-2 text-[11px] font-bold bg-slate-800 text-white rounded px-1.5 py-0.5">
            Out of stock
          </span>
        )}
        {!soldOut && product.lowStock && (
          <span className="absolute top-2 left-2 text-[11px] font-bold bg-[color:var(--accent)] text-navy-900 rounded px-1.5 py-0.5">
            Low stock
          </span>
        )}
      </Link>
      <div className="flex flex-col gap-2 p-3 pt-0 flex-1">
        <Link href={`/product/${product.slug}`} className="text-sm font-medium text-slate-800 line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </Link>
        <PriceTag price={product.priceKES} compareAt={product.compareAtPriceKES} size="sm" />
        <div className="mt-auto pt-1">
          <AddToCartButton
            label="Add"
            item={{
              productId: product.id,
              slug: product.slug || String(product.id),
              title: product.title,
              priceKES: product.priceKES,
              image: img?.url ?? null,
              maxQty: product.stockQty ?? 0,
            }}
          />
        </div>
      </div>
    </div>
  )
}

export const ProductGrid = ({ products }: { products: Product[] }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
    {products.map((p) => (
      <ProductCard key={p.id} product={p} />
    ))}
  </div>
)
