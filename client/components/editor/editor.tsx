import { useEffect, useRef, useCallback, memo } from 'react';
import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import ToolbarPlugin from "./ToolbarPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { EditorState, EditorThemeClasses } from 'lexical';

interface EditorProps {
  text: string;
  onTextChange: (text: string) => void;
}

const theme: EditorThemeClasses = {
  ltr: 'text-left',
  rtl: 'text-right',
  placeholder: 'text-gray-400 absolute overflow-hidden text-ellipsis top-[15px] left-[10px] text-[15px] select-none inline-block pointer-events-none',
  list: {
    nested: {
      listitem: 'list-none'
    },
    ol: 'list-decimal pl-5',
    ul: 'list-disc pl-5',
    listitem: 'my-1'
  },
  link: 'text-blue-600 no-underline',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    underlineStrikethrough: 'underline line-through',
    code: 'bg-gray-100 px-1 py-[1px] font-mono text-[94%]'
  },
  code: 'bg-gray-100 font-mono block p-2 pl-[52px] leading-[1.53] text-[13px] my-2 tab-[2] overflow-x-auto relative',
  codeHighlight: {
    atrule: 'text-[#07a]',
    attr: 'text-[#07a]',
    boolean: 'text-[#905]',
    builtin: 'text-[#690]',
    cdata: 'text-[slategray]',
    char: 'text-[#690]',
    class: 'text-[#dd4a68]',
    'class-name': 'text-[#dd4a68]',
    comment: 'text-[slategray]',
    constant: 'text-[#905]',
    deleted: 'text-[#905]',
    doctype: 'text-[slategray]',
    entity: 'text-[#9a6e3a]',
    function: 'text-[#dd4a68]',
    important: 'text-[#e90]',
    inserted: 'text-[#690]',
    keyword: 'text-[#07a]',
    namespace: 'text-[#e90]',
    number: 'text-[#905]',
    operator: 'text-[#9a6e3a]',
    prolog: 'text-[slategray]',
    property: 'text-[#905]',
    punctuation: 'text-[#999]',
    regex: 'text-[#e90]',
    selector: 'text-[#690]',
    string: 'text-[#690]',
    symbol: 'text-[#905]',
    tag: 'text-[#905]',
    url: 'text-[#9a6e3a]',
    variable: 'text-[#e90]'
  }
};

function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.focus();
  }, [editor]);

  return null;
}

function LoadDataPlugin({ initialText }: { initialText: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      const currentText = $convertToMarkdownString(TRANSFORMERS);

      if (currentText !== initialText) {
        console.log("Loading data", initialText);
        $convertFromMarkdownString(initialText, TRANSFORMERS);
      }
    });
  }, [editor, initialText]);

  return null;
}

export function Editor({ text, onTextChange }: EditorProps) {
  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const markdown = $convertToMarkdownString(TRANSFORMERS);
      onTextChange(markdown);
    });
  };

  const editorConfig: InitialConfigType = {
    namespace: 'PlanEditor',
    theme,
    onError(error: Error) {
      throw error;
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode
    ]
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="m-0 max-w-none w-full text-black relative leading-5 font-normal text-left p-0 flex flex-col">
        <ToolbarPlugin />
        <div className="bg-white relative flex-grow overflow-y-auto">
          <RichTextPlugin
            contentEditable={<ContentEditable className="p-4" />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <MyCustomAutoFocusPlugin />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <LoadDataPlugin initialText={text} />
          <ListPlugin />
          <LinkPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <TabIndentationPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
}

interface MemoizedEditorProps {
  initialText: string;
  onTextChange: (text: string) => void;
}

export const MemoizedEditor = memo(function MemoizedEditor({ initialText, onTextChange }: MemoizedEditorProps) {
  const editorRef = useRef<{ text: string }>({ text: initialText });

  useEffect(() => {
    // Initialize the editor text once
    editorRef.current.text = initialText;
  }, []); // Empty deps array means this only runs once on mount

  const handleTextChange = useCallback((newText: string) => {
    // Update our ref first
    editorRef.current.text = newText;
    onTextChange(newText);
  }, [onTextChange]);

  return (
    <Editor
      text={editorRef.current.text}
      onTextChange={handleTextChange}
    />
  );
}, () => {
  // Always return true to prevent any rerenders
  return true;
});