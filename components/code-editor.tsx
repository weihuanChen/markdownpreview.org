"use client"

import { useMemo, useEffect, useRef } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { markdown } from "@codemirror/lang-markdown"
import { EditorView } from "@codemirror/view"
import { vscodeDark } from "@uiw/codemirror-theme-vscode"
import type { ViewUpdate } from "@codemirror/view"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  theme: "light" | "dark"
}

export default function CodeEditor({ value, onChange, theme }: CodeEditorProps) {
  const viewRef = useRef<EditorView | null>(null)
  const extensions = useMemo(() => [markdown(), EditorView.lineWrapping], [])

  useEffect(() => {
    const handleReplace = (e: CustomEvent<{ content: string }>) => {
      if (viewRef.current) {
        const view = viewRef.current
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: e.detail.content,
          },
        })
        onChange(e.detail.content)
      }
    }

    const handleInsert = (e: CustomEvent<{ content: string }>) => {
      if (viewRef.current) {
        const view = viewRef.current
        const selection = view.state.selection.main
        const from = selection.from
        const to = selection.to
        view.dispatch({
          changes: {
            from,
            to,
            insert: e.detail.content,
          },
          selection: {
            anchor: from + e.detail.content.length,
          },
        })
        const newValue = view.state.doc.toString()
        onChange(newValue)
      }
    }

    window.addEventListener("editor:replace", handleReplace as EventListener)
    window.addEventListener("editor:insert", handleInsert as EventListener)

    return () => {
      window.removeEventListener("editor:replace", handleReplace as EventListener)
      window.removeEventListener("editor:insert", handleInsert as EventListener)
    }
  }, [onChange])

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={theme === "dark" ? vscodeDark : "light"}
      extensions={extensions}
      onChange={onChange}
      onUpdate={(update: ViewUpdate) => {
        if (update.view) {
          viewRef.current = update.view
        }
      }}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
      }}
      className="h-full text-base"
      style={{ height: "100%", fontSize: "14px" }}
    />
  )
}
