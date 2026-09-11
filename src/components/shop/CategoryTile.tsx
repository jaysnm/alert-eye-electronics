import Link from 'next/link'
import type { Category } from '@/payload-types'
import { pickImage } from './ProductImage'
import { ProductImage } from './ProductImage'

export const CategoryTile = ({ category }: { category: Category }) => {
  const img = pickImage(category.image as never, 'card')
  return (
    <Link
      href={`/shop/${category.slug}`}
      className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center hover:shadow-md hover:border-navy-100 transition"
    >
      <div className="relative h-20 w-20">
        <ProductImage src={img} sizes="80px" />
      </div>
      <span className="text-sm font-semibold text-navy-900">{category.name}</span>
    </Link>
  )
}
