import { createFileRoute, redirect } from '@tanstack/react-router'
import { checkAuthSessionServerFn } from '../../lib/server/auth'
import { publishArticleServerFn } from '../../lib/server/articles'
import { MarkdownPublisher } from '../../components/publisher/MarkdownPublisher'

export const Route = createFileRoute('/admin/new')({
  loader: async () => {
    const session = await checkAuthSessionServerFn()
    if (!session.authenticated) {
      throw redirect({ to: '/admin/login' })
    }
    return {}
  },
  head: () => ({
    meta: [
      { title: 'New Article — Markdown Publisher' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: NewArticleComponent,
})

function NewArticleComponent() {
  const handlePublish = async (data: { markdown: string; metadata: any }) => {
    return await publishArticleServerFn({ data })
  }

  return (
    <div className="py-6">
      <MarkdownPublisher onPublish={handlePublish} />
    </div>
  )
}
