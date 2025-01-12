import { trpc } from './trpc'
import { useQuery } from '@tanstack/react-query'

export function useNote(id: string) {
  return useQuery({
    queryKey: ['note', id],
    queryFn: () => trpc.getNote.query({ id }),
    enabled: !!id,
  })
}