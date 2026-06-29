import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { publicApi } from '@/api/public'
import BuilderPageRenderer, { type BuilderLayout } from '@/components/builder/BuilderPageRenderer'
import PageLoader from '@/components/shared/PageLoader'

export default function CustomBuilderPage() {
  const { slug = '' } = useParams()
  const [layout, setLayout] = useState<BuilderLayout | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLayout(null)

    publicApi.page(slug)
      .then((response) => {
        if (active) setLayout(response.data.data?.layout || null)
      })
      .catch(() => {
        if (active) setLayout(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [slug])

  if (loading) return <PageLoader />

  if (layout?.sections?.length) {
    return <BuilderPageRenderer layout={layout} />
  }

  return (
    <section className="min-h-[60vh] bg-background pt-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground">Page not published yet</h1>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          This page exists in the builder but does not have a published layout yet.
        </p>
        <Link to="/" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Back to home
        </Link>
      </div>
    </section>
  )
}
