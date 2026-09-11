import Link from 'next/link'
import { getHomepage, getNavCategories, getProducts, getServiceTypes, getSiteSettings } from '@/lib/queries'
import { Hero } from '@/components/site/Hero'
import { SectionHeading } from '@/components/site/SectionHeading'
import { ProductGrid } from '@/components/shop/ProductCard'
import { CategoryTile } from '@/components/shop/CategoryTile'
import { IconBadge } from '@/components/site/IconBadge'
import { ServiceCard } from '@/components/services/ServiceCard'
import { pickImage } from '@/components/shop/ProductImage'
import type { Category, Media } from '@/payload-types'

export const revalidate = 120

export default async function HomePage() {
  const [homepage, settings, navCategories, services, featured, newest] = await Promise.all([
    getHomepage(),
    getSiteSettings(),
    getNavCategories(),
    getServiceTypes(),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ sort: 'newest', limit: 8 }),
  ])

  const slides = (homepage.slides ?? [])
    .map((s) => {
      const img = pickImage(s.image as number | Media, 'feature')
      return img ? { ...s, image: img.url, alt: img.alt } : null
    })
    .filter(Boolean) as Parameters<typeof Hero>[0]['slides']

  const categories = (
    homepage.featuredCategories && homepage.featuredCategories.length > 0
      ? homepage.featuredCategories
      : navCategories
  ).filter((c): c is Category => typeof c === 'object') as Category[]

  return (
    <div className="container-page py-6 space-y-14">
      <Hero slides={slides} />

      {/* Trust badges */}
      {settings.trustBadges && settings.trustBadges.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {settings.trustBadges.map((b, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-navy-900">
                <IconBadge name={b.icon} />
              </span>
              <div>
                <p className="text-sm font-semibold text-navy-900">{b.title}</p>
                {b.subtitle && <p className="text-xs text-slate-500">{b.subtitle}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <SectionHeading title="Shop by category" href="/shop" />
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.slice(0, 12).map((c) => (
              <CategoryTile key={c.id} category={c} />
            ))}
          </div>
        </section>
      )}

      {/* Promo strip */}
      {homepage.promoStrip?.enabled && (
        <section className="rounded-2xl bg-[color:var(--accent)]/15 border border-[color:var(--accent)]/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-lg font-semibold text-navy-900">{homepage.promoStrip.text}</p>
          {homepage.promoStrip.ctaHref && (
            <Link
              href={homepage.promoStrip.ctaHref}
              className="rounded-lg bg-navy-900 text-white font-semibold px-5 py-2.5 shrink-0"
            >
              {homepage.promoStrip.ctaLabel || 'Learn more'}
            </Link>
          )}
        </section>
      )}

      {/* Featured products */}
      {featured.docs.length > 0 && (
        <section>
          <SectionHeading title="Featured products" subtitle="Hand-picked by our team" href="/shop" />
          <ProductGrid products={featured.docs} />
        </section>
      )}

      {/* Services */}
      {services.length > 0 && (
        <section>
          <SectionHeading
            title="Installation & service"
            subtitle="From CCTV setups to networking — done right, with a warranty"
            href="/services"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.slice(0, 3).map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>
      )}

      {/* New arrivals */}
      {newest.docs.length > 0 && (
        <section>
          <SectionHeading title="New arrivals" href="/shop?sort=newest" />
          <ProductGrid products={newest.docs} />
        </section>
      )}

      {/* Why choose us */}
      {homepage.whyChooseUs && homepage.whyChooseUs.length > 0 && (
        <section className="rounded-2xl bg-navy-900 text-white p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">Why buy from Alert Eye</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {homepage.whyChooseUs.map((r, idx) => (
              <div key={idx}>
                <span className="text-[color:var(--accent)]">
                  <IconBadge name={r.icon} size={26} />
                </span>
                <p className="mt-2 font-semibold">{r.title}</p>
                <p className="text-sm text-slate-300 mt-1">{r.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      {homepage.testimonials && homepage.testimonials.length > 0 && (
        <section>
          <SectionHeading title="What our customers say" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {homepage.testimonials.map((t, idx) => (
              <figure key={idx} className="rounded-xl border border-slate-200 bg-white p-5">
                <blockquote className="text-sm text-slate-700">“{t.quote}”</blockquote>
                <figcaption className="mt-3 text-sm font-semibold text-navy-900">
                  {t.author}
                  {t.role && <span className="font-normal text-slate-500"> · {t.role}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
