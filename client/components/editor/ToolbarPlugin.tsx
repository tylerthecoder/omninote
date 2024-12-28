// @ts-nocheck
/* eslint-disable */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $isParentElementRTL,
  $wrapNodes,
  $isAtNodeEnd
} from "@lexical/selection";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode
} from "@lexical/list";
import { createPortal } from "react-dom";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode
} from "@lexical/rich-text";
import {
  $createCodeNode,
  $isCodeNode,
  getDefaultCodeLanguage,
  getCodeLanguages
} from "@lexical/code";
import {
  MdUndo,
  MdRedo,
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdStrikethroughS,
  MdCode,
  MdLink,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify,
  MdArrowDropDown,
  MdEdit,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdTitle,
  MdSubtitles,
  MdNotes,
} from "react-icons/md";

const LowPriority = 1;

const supportedBlockTypes = new Set([
  "paragraph",
  "quote",
  "code",
  "h1",
  "h2",
  "ul",
  "ol"
]);

const blockTypeToBlockName = {
  code: "Code Block",
  h1: "Large Heading",
  h2: "Small Heading",
  h3: "Heading",
  h4: "Heading",
  h5: "Heading",
  ol: "Numbered List",
  paragraph: "Normal",
  quote: "Quote",
  ul: "Bulleted List"
};

function Divider() {
  return <div className="w-px bg-gray-200 mx-1" />;
}

function positionEditorElement(editor, rect) {
  if (rect === null) {
    editor.style.opacity = "0";
    editor.style.top = "-1000px";
    editor.style.left = "-1000px";
  } else {
    editor.style.opacity = "1";
    editor.style.top = `${rect.top + rect.height + window.pageYOffset + 10}px`;
    editor.style.left = `${
      rect.left + window.pageXOffset - editor.offsetWidth / 2 + rect.width / 2
    }px`;
  }
}

function FloatingLinkEditor({ editor }) {
  const editorRef = useRef(null);
  const inputRef = useRef(null);
  const mouseDownRef = useRef(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isEditMode, setEditMode] = useState(false);
  const [lastSelection, setLastSelection] = useState(null);

  const updateLinkEditor = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent)) {
        setLinkUrl(parent.getURL());
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL());
      } else {
        setLinkUrl("");
      }
    }
    const editorElem = editorRef.current;
    const nativeSelection = window.getSelection();
    const activeElement = document.activeElement;

    if (editorElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();
    if (
      selection !== null &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const domRange = nativeSelection.getRangeAt(0);
      let rect;
      if (nativeSelection.anchorNode === rootElement) {
        let inner = rootElement;
        while (inner.firstElementChild != null) {
          inner = inner.firstElementChild;
        }
        rect = inner.getBoundingClientRect();
      } else {
        rect = domRange.getBoundingClientRect();
      }

      if (!mouseDownRef.current) {
        positionEditorElement(editorElem, rect);
      }
      setLastSelection(selection);
    } else if (!activeElement || activeElement.className !== "link-input") {
      positionEditorElement(editorElem, null);
      setLastSelection(null);
      setEditMode(false);
      setLinkUrl("");
    }

    return true;
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateLinkEditor();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor();
          return true;
        },
        LowPriority
      )
    );
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateLinkEditor();
    });
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    if (isEditMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditMode]);

  return (
    <div ref={editorRef} className="absolute z-50 -top-[10000px] -left-[10000px] mt-[-6px] max-w-[300px] w-full opacity-0 bg-white shadow-lg rounded-lg transition-opacity duration-500">
      {isEditMode ? (
        <input
          ref={inputRef}
          className="block w-[calc(100%-24px)] box-border mx-3 my-2 p-2 rounded-2xl bg-gray-100 text-sm text-gray-900 border-0 outline-0 relative font-inherit"
          value={linkUrl}
          onChange={(event) => {
            setLinkUrl(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (lastSelection !== null) {
                if (linkUrl !== "") {
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
                }
                setEditMode(false);
              }
            } else if (event.key === "Escape") {
              event.preventDefault();
              setEditMode(false);
            }
          }}
        />
      ) : (
        <>
          <div className="block w-[calc(100%-24px)] box-border mx-3 my-2 p-2 rounded-2xl bg-gray-100 text-sm text-gray-900">
            <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 no-underline block whitespace-nowrap overflow-hidden mr-8 text-ellipsis">
              {linkUrl}
            </a>
            <div
              className="bg-[url('images/icons/pencil-fill.svg')] bg-no-repeat bg-center bg-[length:16px] w-[35px] absolute right-0 top-0 bottom-0 cursor-pointer"
              role="button"
              tabIndex={0}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setEditMode(true);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Select({ onChange, className, options, value }) {
  return (
    <select className={`border-0 flex bg-none rounded-lg p-2 align-middle appearance-none w-[70px] text-sm text-gray-600 text-ellipsis ${className}`} onChange={onChange} value={value}>
      <option hidden={true} value="" />
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function getSelectedNode(selection) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
  }
}

function BlockOptionsDropdownList({
  editor,
  blockType,
  toolbarRef,
  setShowBlockOptionsDropDown
}) {
  const dropDownRef = useRef(null);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    const dropDown = dropDownRef.current;

    if (toolbar !== null && dropDown !== null) {
      const { top, left } = toolbar.getBoundingClientRect();
      dropDown.style.top = `${top + 40}px`;
      dropDown.style.left = `${left}px`;
    }
  }, [dropDownRef, toolbarRef]);

  useEffect(() => {
    const dropDown = dropDownRef.current;
    const toolbar = toolbarRef.current;

    if (dropDown !== null && toolbar !== null) {
      const handle = (event) => {
        const target = event.target;

        if (!dropDown.contains(target) && !toolbar.contains(target)) {
          setShowBlockOptionsDropDown(false);
        }
      };
      document.addEventListener("click", handle);

      return () => {
        document.removeEventListener("click", handle);
      };
    }
  }, [dropDownRef, setShowBlockOptionsDropDown, toolbarRef]);

  const formatParagraph = () => {
    if (blockType !== "paragraph") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createParagraphNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatLargeHeading = () => {
    if (blockType !== "h1") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode("h1"));
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatSmallHeading = () => {
    if (blockType !== "h2") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode("h2"));
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatBulletList = () => {
    if (blockType !== "ul") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatNumberedList = () => {
    if (blockType !== "ol") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatQuote = () => {
    if (blockType !== "quote") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createQuoteNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatCode = () => {
    if (blockType !== "code") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createCodeNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  return (
    <div className="z-10 block absolute shadow-lg rounded-lg min-w-[100px] min-h-[40px] bg-white" ref={dropDownRef}>
      <button className="mx-2 my-0 p-2 text-gray-900 cursor-pointer leading-4 text-sm flex items-center flex-row flex-shrink-0 justify-between bg-white rounded-lg border-0 min-w-[268px] hover:bg-gray-100 first:mt-2 last:mb-2" onClick={formatParagraph}>
        <span className="flex leading-5 flex-grow w-[200px]">Normal</span>
        {blockType === "paragraph" && <span className="active" />}
      </button>
      <button className="mx-2 my-0 p-2 text-gray-900 cursor-pointer leading-4 text-sm flex items-center flex-row flex-shrink-0 justify-between bg-white rounded-lg border-0 min-w-[268px] hover:bg-gray-100 first:mt-2 last:mb-2" onClick={formatLargeHeading}>
        <span className="flex leading-5 flex-grow w-[200px]">Large Heading</span>
        {blockType === "h1" && <span className="active" />}
      </button>
      <button className="mx-2 my-0 p-2 text-gray-900 cursor-pointer leading-4 text-sm flex items-center flex-row flex-shrink-0 justify-between bg-white rounded-lg border-0 min-w-[268px] hover:bg-gray-100 first:mt-2 last:mb-2" onClick={formatSmallHeading}>
        <span className="flex leading-5 flex-grow w-[200px]">Small Heading</span>
        {blockType === "h2" && <span className="active" />}
      </button>
      <button className="mx-2 my-0 p-2 text-gray-900 cursor-pointer leading-4 text-sm flex items-center flex-row flex-shrink-0 justify-between bg-white rounded-lg border-0 min-w-[268px] hover:bg-gray-100 first:mt-2 last:mb-2" onClick={formatBulletList}>
        <span className="flex leading-5 flex-grow w-[200px]">Bullet List</span>
        {blockType === "ul" && <span className="active" />}
      </button>
      <button className="mx-2 my-0 p-2 text-gray-900 cursor-pointer leading-4 text-sm flex items-center flex-row flex-shrink-0 justify-between bg-white rounded-lg border-0 min-w-[268px] hover:bg-gray-100 first:mt-2 last:mb-2" onClick={formatNumberedList}>
        <span className="flex leading-5 flex-grow w-[200px]">Numbered List</span>
        {blockType === "ol" && <span className="active" />}
      </button>
      <button className="mx-2 my-0 p-2 text-gray-900 cursor-pointer leading-4 text-sm flex items-center flex-row flex-shrink-0 justify-between bg-white rounded-lg border-0 min-w-[268px] hover:bg-gray-100 first:mt-2 last:mb-2" onClick={formatQuote}>
        <span className="flex leading-5 flex-grow w-[200px]">Quote</span>
        {blockType === "quote" && <span className="active" />}
      </button>
      <button className="mx-2 my-0 p-2 text-gray-900 cursor-pointer leading-4 text-sm flex items-center flex-row flex-shrink-0 justify-between bg-white rounded-lg border-0 min-w-[268px] hover:bg-gray-100 first:mt-2 last:mb-2" onClick={formatCode}>
        <span className="flex leading-5 flex-grow w-[200px]">Code Block</span>
        {blockType === "code" && <span className="active" />}
      </button>
    </div>
  );
}

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState("paragraph");
  const [selectedElementKey, setSelectedElementKey] = useState(null);
  const [showBlockOptionsDropDown, setShowBlockOptionsDropDown] = useState(
    false
  );
  const [codeLanguage, setCodeLanguage] = useState("");
  const [isRTL, setIsRTL] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getTag() : element.getTag();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          setBlockType(type);
          if ($isCodeNode(element)) {
            setCodeLanguage(element.getLanguage() || getDefaultCodeLanguage());
          }
        }
      }
      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));
      setIsRTL($isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  const codeLanguges = useMemo(() => getCodeLanguages(), []);
  const onCodeLanguageSelect = useCallback(
    (e) => {
      editor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage(e.target.value);
          }
        }
      });
    },
    [editor, selectedElementKey]
  );

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

  return (
    <div className="flex mb-px bg-white p-1 rounded-t-lg items-center" ref={toolbarRef}>
      <button
        disabled={!canUndo}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND);
        }}
        className={`border-0 flex bg-none rounded-lg p-2 cursor-pointer items-center ${!canUndo && 'cursor-not-allowed opacity-50'} mr-0.5`}
        aria-label="Undo"
      >
        <MdUndo className="w-5 h-5" />
      </button>
      <button
        disabled={!canRedo}
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND);
        }}
        className={`border-0 flex bg-none rounded-lg p-2 cursor-pointer items-center ${!canRedo && 'cursor-not-allowed opacity-50'}`}
        aria-label="Redo"
      >
        <MdRedo className="w-5 h-5" />
      </button>
      <Divider />
      {supportedBlockTypes.has(blockType) && (
        <>
          <button
            className="border-0 flex bg-none rounded-lg p-2 cursor-pointer items-center"
            onClick={() =>
              setShowBlockOptionsDropDown(!showBlockOptionsDropDown)
            }
            aria-label="Formatting Options"
          >
            {blockType === 'paragraph' && <MdNotes className="w-5 h-5" />}
            {blockType === 'h1' && <MdTitle className="w-5 h-5" />}
            {blockType === 'h2' && <MdSubtitles className="w-5 h-5" />}
            {blockType === 'ul' && <MdFormatListBulleted className="w-5 h-5" />}
            {blockType === 'ol' && <MdFormatListNumbered className="w-5 h-5" />}
            {blockType === 'quote' && <MdFormatQuote className="w-5 h-5" />}
            {blockType === 'code' && <MdCode className="w-5 h-5" />}
            <span className="flex leading-5 w-[200px] text-sm text-gray-600 overflow-hidden h-5 text-left">{blockTypeToBlockName[blockType]}</span>
            <MdArrowDropDown className="w-5 h-5" />
          </button>
          {showBlockOptionsDropDown &&
            createPortal(
              <BlockOptionsDropdownList
                editor={editor}
                blockType={blockType}
                toolbarRef={toolbarRef}
                setShowBlockOptionsDropDown={setShowBlockOptionsDropDown}
              />,
              document.body
            )}
          <Divider />
        </>
      )}
      {blockType === "code" ? (
        <>
          <Select
            className="w-[130px] capitalize"
            onChange={onCodeLanguageSelect}
            options={codeLanguges}
            value={codeLanguage}
          />
          🔽
        </>
      ) : (
        <>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            }}
            className={`border-0 flex bg-none rounded-lg p-2 cursor-pointer items-center mr-0.5 ${isBold ? 'bg-blue-50' : ''} hover:bg-gray-100`}
            aria-label="Format Bold"
          >
            <MdFormatBold className={`w-5 h-5 ${isBold ? 'fill-primary' : ''}`} />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
            }}
            className={`border-0 flex bg-none rounded-lg p-2 cursor-pointer items-center mr-0.5 ${isItalic ? 'bg-blue-50' : ''} hover:bg-gray-100`}
            aria-label="Format Italics"
          >
            <MdFormatItalic className={`w-5 h-5 ${isItalic ? 'fill-primary' : ''}`} />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
            }}
            className={`border-0 flex bg-none rounded-lg p-2 cursor-pointer items-center mr-0.5 ${isUnderline ? 'bg-blue-50' : ''} hover:bg-gray-100`}
            aria-label="Format Underline"
          >
            <MdFormatUnderlined className={`w-5 h-5 ${isUnderline ? 'fill-primary' : ''}`} />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
            }}
            className={`border-0 flex bg-none rounded-lg p-2 cursor-pointer items-center mr-0.5 ${isStrikethrough ? 'bg-blue-50' : ''} hover:bg-gray-100`}
            aria-label="Format Strikethrough"
          >
            <MdStrikethroughS className={`w-5 h-5 ${isStrikethrough ? 'fill-primary' : ''}`} />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
            }}
            className={`border-0 flex bg-none rounded-lg p-2 cursor-pointer items-center mr-0.5 ${isCode ? 'bg-blue-50' : ''} hover:bg-gray-100`}
            aria-label="Insert Code"
          >
            <MdCode className={`w-5 h-5 ${isCode ? 'fill-primary' : ''}`} />
          </button>
          <button
            onClick={insertLink}
            className={`border-0 flex bg-none rounded-lg p-2 cursor-pointer items-center mr-0.5 ${isLink ? 'bg-blue-50' : ''} hover:bg-gray-100`}
            aria-label="Insert Link"
          >
            <MdLink className={`w-5 h-5 ${isLink ? 'fill-primary' : ''}`} />
          </button>
          {isLink &&
            createPortal(<FloatingLinkEditor editor={editor} />, document.body)}
          <Divider />
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
            }}
            className="border-0 flex bg-none rounded-lg p-2 cursor-pointer items-center mr-0.5 hover:bg-gray-100"
            aria-label="Left Align"
          >
            <MdFormatAlignLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
            }}
            className="border-0 flex bg-none rounded-lg p-2 cursor-pointer items-center mr-0.5 hover:bg-gray-100"
            aria-label="Center Align"
          >
            <MdFormatAlignCenter className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
            }}
            className="border-0 flex bg-none rounded-lg p-2 cursor-pointer items-center mr-0.5 hover:bg-gray-100"
            aria-label="Right Align"
          >
            <MdFormatAlignRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
            }}
            className="border-0 flex bg-none rounded-lg p-2 cursor-pointer items-center hover:bg-gray-100"
            aria-label="Justify Align"
          >
            <MdFormatAlignJustify className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}