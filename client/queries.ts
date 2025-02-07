import { trpc } from './trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DebouncerStatus } from './utils'
import { Note, Plan } from 'tt-services'
import { useState, useRef } from 'react'

// Standard query keys for all queries
export const queryKeys = {
  note: (id: string) => ['note', id] as const,
  notes: () => ['notes'] as const,
  plan: (date: string) => ['plan', date] as const,
  daysWithNotes: () => ['daysWithNotes'] as const,
  timeBlocks: (date: string) => ['timeBlocks', date] as const
}

// Standard debounced mutation hook
export function useDebouncedMutation<TData, TVariables>({
  mutationFn,
  onSuccess,
  onError,
  delay = 500
}: {
  mutationFn: (variables: TVariables) => Promise<TData>,
  onSuccess?: (data: TData, variables: TVariables) => void,
  onError?: (error: Error) => void,
  delay?: number
}) {
  const [status, setStatus] = useState<DebouncerStatus>('synced')
  const timeoutRef = useRef<NodeJS.Timeout>()

  const mutation = useMutation({
    mutationFn: (variables: TVariables) => {
      setStatus('not-synced')
      return new Promise<TData>((resolve, reject) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(async () => {
          try {
            setStatus('syncing')
            const result = await mutationFn(variables)
            setStatus('synced')
            resolve(result)
            onSuccess?.(result, variables)
          } catch (error) {
            setStatus('error')
            reject(error)
            onError?.(error as Error)
          }
        }, delay)
      })
    }
  })

  return { mutation, status }
}

// Note queries
export function useNote(id: string) {
  return useQuery({
    queryKey: queryKeys.note(id),
    queryFn: () => trpc.getNote.query({ id }),
    enabled: !!id,
  })
}

export function useAllNotes() {
  return useQuery({
    queryKey: queryKeys.notes(),
    queryFn: () => trpc.getAllNotes.query(),
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useDebouncedMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      return trpc.updateNote.mutate({ id, content })
    },
    onSuccess: (updatedNote, { id }) => {
      queryClient.setQueryData(queryKeys.note(id), (oldNote: Note) => ({
        ...oldNote,
        content: updatedNote.content,
      }))
    }
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => trpc.createNote.mutate({
      title: 'New Note',
      content: '',
      date: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes() })
    }
  })
}

// Daily plan queries
export function useToday() {
  const today = new Date().toISOString().split('T')[0]
  return useQuery({
    queryKey: queryKeys.plan(today),
    queryFn: () => trpc.getToday.query(),
  })
}

export function useDayPlan(date: string) {
  return useQuery({
    queryKey: queryKeys.plan(date),
    queryFn: () => trpc.getPlanByDay.query({ date }),
    enabled: !!date,
  })
}

export function useDaysWithNotes() {
  return useQuery({
    queryKey: queryKeys.daysWithNotes(),
    queryFn: () => trpc.getDaysWithNotes.query(),
  })
}

export function useTimeBlocksForDay(date: string) {
  return useQuery({
    queryKey: queryKeys.timeBlocks(date),
    queryFn: () => trpc.getTimeBlocksForDay.query({ date }),
    refetchInterval: 60000, // Refresh every minute
  })
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()

  return useDebouncedMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      return trpc.updatePlan.mutate({ id, text })
    },
    onSuccess: (_, variables) => {
      // Get the date from the cache to know which day to invalidate
      const queries = queryClient.getQueriesData<any>({ queryKey: ['plan'] })
      for (const [queryKey, data] of queries) {
        if (data?.id === variables.id) {
          queryClient.invalidateQueries({ queryKey })
          break
        }
      }
    }
  })
}

export function useCreatePlan() {
  const queryClient = useQueryClient()

  return useDebouncedMutation({
    mutationFn: async ({ text, day }: { text: string; day: string }) => {
      return trpc.createPlan.mutate({ text, day })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plan(variables.day) })
      queryClient.invalidateQueries({ queryKey: queryKeys.daysWithNotes() })
    }
  })
}

export function useStartTimeBlock() {
  const queryClient = useQueryClient()
  const today = new Date().toISOString().split('T')[0]

  return useMutation({
    mutationFn: (label: string) => trpc.startTimeBlock.mutate({ label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeBlocks(today) })
    }
  })
}

export function useEndTimeBlock() {
  const queryClient = useQueryClient()
  const today = new Date().toISOString().split('T')[0]

  return useMutation({
    mutationFn: () => trpc.endTimeBlock.mutate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeBlocks(today) })
    }
  })
}