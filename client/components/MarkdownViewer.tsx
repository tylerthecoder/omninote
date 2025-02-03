import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"


function MarkdownViewer({ markdown }: { markdown: string }) {
    return <div className="prose max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
}

export default MarkdownViewer

