'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/useSession'
import { Send, MessageSquare, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

interface Comment {
  id: string
  description: string
  createdAt: string
  User?: {
    id: string
    name: string
    email: string
  }
}

interface CommentsSectionProps {
  entityType: string
  entityId: string
}

export default function CommentsSection({ entityType, entityId }: CommentsSectionProps) {
  const { data: session } = useSession()
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: commentsData, mutate: mutateComments } = useData<{ comments: Comment[] }>(
    `/api/comments?entityType=${entityType}&entityId=${entityId}`,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  )

  const comments = commentsData?.comments || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          comment: comment.trim(),
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to add comment')
      }

      const { comment: newComment } = await res.json()

      // Optimistic update
      const updatedComments = [newComment, ...comments]
      await mutateComments({ comments: updatedComments }, { revalidate: false })
      await mutate(`/api/comments?entityType=${entityType}&entityId=${entityId}`, { comments: updatedComments }, { revalidate: false })

      setComment('')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Yorum eklenemedi', error?.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary-600" />
        <h3 className="text-lg font-semibold">Yorumlar ({comments.length})</h3>
      </div>

      {/* Yorum formu */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Yorum ekle..."
            rows={3}
            disabled={loading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={loading || !comment.trim()}
            className="self-end"
            aria-label="Yorum gÃ¶nder"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Yorum listesi */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">HenÃ¼z yorum yok</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src={(comment.User as any)?.image || ''} alt={comment.User?.name || ''} />
                <AvatarFallback className="bg-gradient-to-r from-primary-600 to-purple-600 text-white text-xs">
                  {comment.User?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{comment.User?.name || 'Bilinmeyen'}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleString('tr-TR')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}





