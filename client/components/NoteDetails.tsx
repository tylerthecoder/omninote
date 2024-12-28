import { useState, ReactNode } from 'react'
import { IoMdArrowDropdown, IoMdArrowDropright, IoMdCalendar, IoMdTime, IoMdMegaphone, IoMdLock } from 'react-icons/io'
import { Note } from 'tt-services'
import { TagView } from './TagView'

interface NoteDetailsProps {
  note: Note
  syncStatus?: string
  onTitleChange?: (title: string) => void
  onPublishToggle?: (isPublished: boolean) => void
  onAddTag?: (tag: string) => void
  onRemoveTag?: (tag: string) => void
}

export function NoteDetails({
  note,
  syncStatus,
  onTitleChange,
  onPublishToggle,
  onAddTag,
  onRemoveTag,
}: NoteDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-gray-500 w-24">{label}</span>
      {children}
    </div>
  )

  return (
    <div className="bg-white shadow">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 p-4 hover:bg-gray-50 transition-colors"
      >
        {isExpanded ? <IoMdArrowDropdown className="w-5 h-5" /> : <IoMdArrowDropright className="w-5 h-5" />}
        <span className="font-medium">Note Details</span>
      </button>
      {isExpanded && (
        <div className="p-6 space-y-4 border-t">
          <DetailRow label="Title">
            {onTitleChange ? (
              <input
                type="text"
                value={note.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="flex-1 text-2xl font-bold border-0 bg-transparent p-2 focus:outline-none focus:bg-gray-100 rounded transition-colors duration-200"
              />
            ) : (
              <span className="text-2xl font-bold">{note.title}</span>
            )}
          </DetailRow>
          {syncStatus && (
            <DetailRow label="Status">
              <span className="text-sm text-gray-700">{syncStatus}</span>
            </DetailRow>
          )}
          <DetailRow label="Created">
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <IoMdCalendar className="w-4 h-4" />
              {new Date(note.createdAt).toLocaleString()}
            </span>
          </DetailRow>
          <DetailRow label="Updated">
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <IoMdTime className="w-4 h-4" />
              {new Date(note.updatedAt).toLocaleString()}
            </span>
          </DetailRow>
          <DetailRow label="Tags">
            <div className="flex-1">
              <TagView
                tags={note.tags || []}
                onNewTag={onAddTag}
                onRemoveTag={onRemoveTag}
              />
            </div>
          </DetailRow>
          {onPublishToggle && (
            <DetailRow label="Visibility">
              <button
                onClick={() => onPublishToggle(note.published)}
                className="btn btn-primary btn-sm flex items-center gap-2"
              >
                {note.published ? <IoMdLock className="w-4 h-4" /> : <IoMdMegaphone className="w-4 h-4" />}
                {note.published ? 'Unpublish' : 'Publish'}
              </button>
            </DetailRow>
          )}
        </div>
      )}
    </div>
  )
}