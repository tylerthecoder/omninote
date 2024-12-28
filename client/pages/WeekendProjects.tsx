import { useState } from 'react'
import { useNavigate, useParams, Route, Routes } from 'react-router-dom'
import { trpc } from '../trpc'
import { WeekendProject } from 'tt-services'
import { AppPage } from '../layout/AppPage'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { IoMdAdd } from 'react-icons/io'
import { MemoizedEditor } from '../components/editor/editor'
import { Debouncer, DebouncerStatus } from '../utils'

const debouncer = new Debouncer(500)

function WeekendProjectsList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['weekendProjects'],
    queryFn: () => trpc.getAllWeekendProjects.query()
  })

  const createProjectMutation = useMutation({
    mutationFn: (title: string) => trpc.createWeekendProject.mutate({ title }),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['weekendProjects'] })
      navigate(`/weekend-projects/edit/${newProject.id}`)
    }
  })

  const handleCreateProject = () => {
    createProjectMutation.mutate('New Weekend Project')
  }

  const content = (
    <div className="space-y-6">
      {(error || createProjectMutation.error) && (
        <div className="error-message">
          {error?.message || createProjectMutation.error?.message}
        </div>
      )}

      {isLoading ? (
        <div className="loading-message">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {projects?.map(project => (
            <div key={project.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-semibold">{project.title}</h3>
                {project.notes && (
                  <p className="text-gray-600 line-clamp-3">{project.notes}</p>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={() => navigate(`/weekend-projects/edit/${project.id}`)}
                    className="btn btn-primary btn-sm"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <AppPage
      title="Weekend Projects"
      content={content}
      actions={
        <button
          onClick={handleCreateProject}
          className="btn btn-primary flex items-center gap-2"
          disabled={createProjectMutation.isPending}
        >
          <IoMdAdd className="w-5 h-5" />
          New Project
        </button>
      }
    />
  )
}

function WeekendProjectEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [syncStatus, setSyncStatus] = useState<DebouncerStatus>('synced')

  const { data: project, error, isLoading } = useQuery({
    queryKey: ['weekendProject', id],
    queryFn: () => trpc.getWeekendProject.query({ id: id! }),
    enabled: !!id
  })

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<WeekendProject> & { id: string }) => {
      setSyncStatus('syncing')
      return new Promise((resolve, reject) => {
        debouncer.debounce('updateProject', async () => {
          try {
            const result = await trpc.updateWeekendProject.mutate(updates)
            setSyncStatus('synced')
            resolve(result)
          } catch (error) {
            setSyncStatus('error')
            reject(error)
          }
        })
      })
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['weekendProject', id], updatedProject)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!window.confirm('Are you sure you want to delete this project?')) {
        throw new Error('Delete cancelled')
      }
      return trpc.deleteWeekendProject.mutate({ id: id! })
    },
    onSuccess: () => {
      navigate('/weekend-projects')
    }
  })

  const handleUpdate = (field: keyof WeekendProject, value: string) => {
    if (!project) return
    updateMutation.mutate({ id: project.id, [field]: value })
  }

  const content = (
    <div className="space-y-6">
      {(error || updateMutation.error || deleteMutation.error) && (
        <div className="error-message">
          {error?.message || updateMutation.error?.message || deleteMutation.error?.message}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <input
              type="text"
              value={project?.title || ''}
              onChange={(e) => handleUpdate('title', e.target.value)}
              placeholder="Project Title"
              className="title-input"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <MemoizedEditor
              initialText={project?.notes || ''}
              onTextChange={(text) => handleUpdate('notes', text)}
            />
          </div>

          <p className="text-sm text-gray-500 italic">
            Status: {syncStatus}
          </p>
        </div>
      </div>
    </div>
  )

  if (error) return <AppPage title="Error" content={<div className="error-message">{error.message}</div>} />
  if (isLoading || !project) return <AppPage title="Loading..." content={<div className="loading-message">Loading...</div>} />

  return (
    <AppPage
      title={`Edit: ${project.title}`}
      content={content}
      showBack
      backTo="/weekend-projects"
      actions={
        <button
          onClick={() => deleteMutation.mutate()}
          className="btn btn-danger"
          disabled={deleteMutation.isPending}
        >
          Delete Project
        </button>
      }
    />
  )
}

export function WeekendProjectsRouter() {
  return (
    <Routes>
      <Route index element={<WeekendProjectsList />} />
      <Route path="edit/:id" element={<WeekendProjectEdit />} />
    </Routes>
  )
}