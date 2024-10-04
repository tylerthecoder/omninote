import { useEffect, useState } from 'react';
import { Debouncer } from './utils';
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
import ToolbarPlugin from "./lexical-plugins/ToolbarPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { EditorState, EditorThemeClasses } from 'lexical';
import { trpc } from './trpc';
import styles from './plan-editor.module.css';

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

const theme: EditorThemeClasses = {
  ltr: styles.ltr,
  rtl: styles.rtl,
  placeholder: styles.editorPlaceholder,
  // Remove paragraph, quote, and heading styles
  list: {
    nested: {
      listitem: styles.editorNestedListitem
    },
    ol: styles.editorListOl,
    ul: styles.editorListUl,
    listitem: styles.editorListitem
  },
  link: styles.editorLink,
  text: {
    bold: styles.editorTextBold,
    italic: styles.editorTextItalic,
    underline: styles.editorTextUnderline,
    strikethrough: styles.editorTextStrikethrough,
    underlineStrikethrough: styles.editorTextUnderlineStrikethrough,
    code: styles.editorTextCode
  },
  code: styles.editorCode,
  codeHighlight: {
    atrule: styles.editorTokenAttr,
    attr: styles.editorTokenAttr,
    boolean: styles.editorTokenProperty,
    builtin: styles.editorTokenSelector,
    cdata: styles.editorTokenComment,
    char: styles.editorTokenSelector,
    class: styles.editorTokenFunction,
    "class-name": styles.editorTokenFunction,
    comment: styles.editorTokenComment,
    constant: styles.editorTokenProperty,
    deleted: styles.editorTokenProperty,
    doctype: styles.editorTokenComment,
    entity: styles.editorTokenOperator,
    function: styles.editorTokenFunction,
    important: styles.editorTokenVariable,
    inserted: styles.editorTokenSelector,
    keyword: styles.editorTokenAttr,
    namespace: styles.editorTokenVariable,
    number: styles.editorTokenProperty,
    operator: styles.editorTokenOperator,
    prolog: styles.editorTokenComment,
    property: styles.editorTokenProperty,
    punctuation: styles.editorTokenPunctuation,
    regex: styles.editorTokenVariable,
    selector: styles.editorTokenSelector,
    string: styles.editorTokenSelector,
    symbol: styles.editorTokenProperty,
    tag: styles.editorTokenProperty,
    url: styles.editorTokenOperator,
    variable: styles.editorTokenVariable
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

  console.log("Styles:", styles);

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

  const editorConfig: InitialConfigType = {
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
    <div style={{ height: '100%' }}>
      <LexicalComposer initialConfig={editorConfig}>
        <div className={styles.editorContainer}>
          <ToolbarPlugin />
          <div className={styles.editorInner}>
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