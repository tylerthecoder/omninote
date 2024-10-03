import { useEffect, useState } from 'react';
import { Debouncer } from './utils';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
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
import ToolbarPlugin from "./lexical-plugins/ToolbarPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { EditorState } from 'lexical';
import { trpc } from './trpc';

// import ListMaxIndentLevelPlugin from "./lexical-plugins/ListMaxIndentLevelPlugin";
// import CodeHighlightPlugin from "./lexical-plugins/CodeHighlightPlugin";
// import AutoLinkPlugin from "./lexical-plugins/AutoLinkPlugin";

interface PlanEditorProps {
  initialPlan: string;
  planId: string;
}

const debouncer = new Debouncer(500);

type SyncStatus = 'not-synced' | 'synced' | 'syncing...' | 'error';

const prettySyncStatus = (status: SyncStatus) => {
  switch (status) {
    case 'not-synced':
      return 'Not synced';
    case 'synced':
      return 'Synced';
    case 'syncing...':
      return 'Syncing...';
    case 'error':
      return 'Error';
  }
}

const theme = {
  ltr: "ltr",
  rtl: "rtl",
  placeholder: "editor-placeholder",
  paragraph: "editor-paragraph",
  quote: "editor-quote",
  heading: {
    h1: "editor-heading-h1",
    h2: "editor-heading-h2",
    h3: "editor-heading-h3",
    h4: "editor-heading-h4",
    h5: "editor-heading-h5"
  },
  list: {
    nested: {
      listitem: "editor-nested-listitem"
    },
    ol: "editor-list-ol",
    ul: "editor-list-ul",
    listitem: "editor-listitem"
  },
  image: "editor-image",
  link: "editor-link",
  text: {
    bold: "editor-text-bold",
    italic: "editor-text-italic",
    overflowed: "editor-text-overflowed",
    hashtag: "editor-text-hashtag",
    underline: "editor-text-underline",
    strikethrough: "editor-text-strikethrough",
    underlineStrikethrough: "editor-text-underlineStrikethrough",
    code: "editor-text-code"
  },
  code: "editor-code",
  codeHighlight: {
    atrule: "editor-tokenAttr",
    attr: "editor-tokenAttr",
    boolean: "editor-tokenProperty",
    builtin: "editor-tokenSelector",
    cdata: "editor-tokenComment",
    char: "editor-tokenSelector",
    class: "editor-tokenFunction",
    "class-name": "editor-tokenFunction",
    comment: "editor-tokenComment",
    constant: "editor-tokenProperty",
    deleted: "editor-tokenProperty",
    doctype: "editor-tokenComment",
    entity: "editor-tokenOperator",
    function: "editor-tokenFunction",
    important: "editor-tokenVariable",
    inserted: "editor-tokenSelector",
    keyword: "editor-tokenAttr",
    namespace: "editor-tokenVariable",
    number: "editor-tokenProperty",
    operator: "editor-tokenOperator",
    prolog: "editor-tokenComment",
    property: "editor-tokenProperty",
    punctuation: "editor-tokenPunctuation",
    regex: "editor-tokenVariable",
    selector: "editor-tokenSelector",
    string: "editor-tokenSelector",
    symbol: "editor-tokenProperty",
    tag: "editor-tokenProperty",
    url: "editor-tokenOperator",
    variable: "editor-tokenVariable"
  }
};

function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.focus();
  }, [editor]);

  return null;
}

function LoadDataPlugin({ initialPlan }: { initialPlan: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {

    editor.update(() => {
      $convertFromMarkdownString(initialPlan, TRANSFORMERS);
    });

  }, [editor]);

  return null;
}

export function PlanEditor({ initialPlan, planId }: PlanEditorProps) {
  console.log("Initial plan:", initialPlan);
  const [plan, setPlan] = useState(initialPlan);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('not-synced');

  useEffect(() => {
    debouncer.addStartListener(() => {
      setSyncStatus('syncing...');
    });
    debouncer.addDoneListener(() => {
      setSyncStatus('synced');
    });
    debouncer.addErrorListener(() => {
      setSyncStatus('error');
    });
  }, []);

  console.log("Here");

  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      console.log("Change detected", editorState);
      const raw = $convertToMarkdownString(TRANSFORMERS);
      const newPlan = raw.trim();
      setPlan(newPlan);
      setSyncStatus('not-synced');
      debouncer.debounce(async () => {
        await trpc.updatePlan.mutate(
          { id: planId, text: newPlan },
        );
      });
    });
  };

  const editorConfig = {
    namespace: 'PlanEditor',
    // The editor theme
    theme,
    // Handling of errors during update
    onError(error: Error) {
      throw error;
    },
    // Any custom nodes go here
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
    <div>
      <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<div>Enter your plan...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <MyCustomAutoFocusPlugin />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <LoadDataPlugin initialPlan={plan} />
          {/* <CodeHighlightPlugin /> */}
          <ListPlugin />
          <LinkPlugin />
          {/* <AutoLinkPlugin /> */}
          {/* <ListMaxIndentLevelPlugin maxDepth={7} /> */}
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </div>
      </div>
    </LexicalComposer>
      <p>Status: {prettySyncStatus(syncStatus)}</p>
    </div>
  );
}
