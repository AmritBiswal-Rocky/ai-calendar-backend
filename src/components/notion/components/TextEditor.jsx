// src/components/notion/components/TextEditor.jsx
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Slate, Editable } from 'slate-react';
import { createEditor } from 'slate';
import { withHistory } from 'slate-history';

const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

const TextEditor = () => {
  const editor = useMemo(() => withHistory(createEditor()), []);
  const [value, setValue] = useState(initialValue);
  const [formattedText, setFormattedText] = useState('');
  const editorRef = useRef(null);

  /* ─────────────── Render Blocks ─────────────── */
  const renderElement = useCallback((props) => {
    switch (props.element.type) {
      case 'heading-one':
        return <h1 {...props.attributes}>{props.children}</h1>;
      case 'heading-two':
        return <h2 {...props.attributes}>{props.children}</h2>;
      case 'heading-three':
        return <h3 {...props.attributes}>{props.children}</h3>;
      case 'bulleted-list':
        return <ul {...props.attributes}>{props.children}</ul>;
      case 'numbered-list':
        return <ol {...props.attributes}>{props.children}</ol>;
      case 'list-item':
        return <li {...props.attributes}>{props.children}</li>;
      default:
        return <p {...props.attributes}>{props.children}</p>;
    }
  }, []);

  /* ─────────────── Render Inline Styles ─────────────── */
  const renderLeaf = useCallback((props) => {
    return <span {...props.attributes}>{props.children}</span>;
  }, []);

  /* ─────────────── Handle Change ─────────────── */
  const handleOnChange = useCallback((newValue) => {
    setValue(newValue);
    setFormattedText(JSON.stringify(newValue, null, 2)); // no debounce
  }, []);

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
      <Slate editor={editor} value={value} onChange={handleOnChange}>
        <Editable
          ref={editorRef}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="Start writing..."
          className="focus:outline-none text-lg text-gray-900 dark:text-gray-100"
        />
      </Slate>

      {/* Debug output (can remove later) */}
      <pre className="mt-4 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
        {formattedText}
      </pre>
    </div>
  );
};

export default TextEditor;
