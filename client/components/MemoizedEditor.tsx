import { memo, useCallback, useRef, useEffect } from 'react'
import { Editor } from '../editor/editor'

interface MemoizedEditorProps {
  initialText: string
  onTextChange: (text: string) => void
}

export const MemoizedEditor = memo(function MemoizedEditor({ initialText, onTextChange }: MemoizedEditorProps) {
  const editorRef = useRef<{ text: string }>({ text: initialText })

  useEffect(() => {
    // Initialize the editor text once
    editorRef.current.text = initialText
  }, []) // Empty deps array means this only runs once on mount

  const handleTextChange = useCallback((newText: string) => {
    // Update our ref first
    editorRef.current.text = newText
    onTextChange(newText)
  }, [onTextChange])

  return (
    <Editor
      text={editorRef.current.text}
      onTextChange={handleTextChange}
    />
  )
}, () => {
  // Always return true to prevent any rerenders
  return true
})