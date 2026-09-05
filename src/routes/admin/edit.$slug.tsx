import { createFileRoute, redirect, notFound } from '@tanstack/react-router'
import { checkAuthSessionServerFn } from '../../lib/server/auth'
import { getArticleBySlugServerFn, updateArticleServerFn } from '../../lib/server/articles'
import { MarkdownPublisher } from '../../components/publisher/MarkdownPublisher'

export const Route = createFileRoute('/admin/edit/$slug')({
  loader: async ({ params }) => {
    const session = await checkAuthSessionServerFn()
    if (!session.authenticated) {
      throw redirect({ to: '/admin/login' })
    }

    const article = await getArticleBySlugServerFn({ data: params.slug })
    if (!article) {
      throw notFound()
    }

    return { article }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Edit: ${loaderData?.article?.metadata?.title || 'Article'} — Publisher` },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: EditArticleComponent,
})

function EditArticleComponent() {
  const { article } = Route.useLoaderData()

  const handleUpdate = async (data: { markdown: string; metadata: any }) => {
    return await updateArticleServerFn({ data })
  }

  return (
    <div className="py-6">
      <MarkdownPublisher
        isEditing={true}
        initialMarkdown={article.markdown}
        initialMetadata={article.metadata}
        onPublish={handleUpdate}
      />
    </div>
  )
}
