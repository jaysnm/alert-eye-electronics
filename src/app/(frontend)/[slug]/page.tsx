import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/lib/queries'
import { RichText } from '@/components/site/RichText'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  return { title: page?.title ?? 'Page', description: page?.intro ?? undefined }
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) notFound()

  return (
    <article className="container-page py-10 max-w-3xl">
      <h1 className="text-3xl font-bold text-navy-900">{page.title}</h1>
      {page.intro && <p className="mt-3 text-lg text-slate-600">{page.intro}</p>}
      <div className="mt-6">
        <RichText data={page.body} />
      </div>
    </article>
  )
}
