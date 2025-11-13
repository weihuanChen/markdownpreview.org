"use client"

import { useMemo } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { markdown } from "@codemirror/lang-markdown"
import { EditorView } from "@codemirror/view"
import { vscodeDark } from "@uiw/codemirror-theme-vscode"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  theme: "light" | "dark"
}

export default function CodeEditor({ value, onChange, theme }: CodeEditorProps) {
  const extensions = useMemo(() => [markdown(), EditorView.lineWrapping], [])

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={theme === "dark" ? vscodeDark : "light"}
      extensions={extensions}
      onChange={onChange}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: true,
        highlightActiveLine: true,
        foldGutter: true,
      }}
      className="h-full text-base"
      style={{ height: "100%", fontSize: "14px" }}
    />
  )
}
