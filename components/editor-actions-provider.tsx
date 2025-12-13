"use client"

import { createContext, useContext, useCallback, type ReactNode } from "react"

interface EditorActionsContextType {
  replaceContent: (content: string) => void
  insertAtCursor: (content: string) => void
}

const EditorActionsContext = createContext<EditorActionsContextType | undefined>(undefined)

export function EditorActionsProvider({ children }: { children: ReactNode }) {
  const scrollToEditor = useCallback(() => {
    // 使用 setTimeout 确保 DOM 已经更新
    setTimeout(() => {
      const editorElement = document.getElementById("markdown-editor")
      if (editorElement) {
        editorElement.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }, [])

  const replaceContent = useCallback((content: string) => {
    window.dispatchEvent(
      new CustomEvent("editor:replace", {
        detail: { content },
      })
    )
    scrollToEditor()
  }, [scrollToEditor])

  const insertAtCursor = useCallback((content: string) => {
    window.dispatchEvent(
      new CustomEvent("editor:insert", {
        detail: { content },
      })
    )
    scrollToEditor()
  }, [scrollToEditor])

  return (
    <EditorActionsContext.Provider value={{ replaceContent, insertAtCursor }}>
      {children}
    </EditorActionsContext.Provider>
  )
}

export function useEditorActions() {
  const context = useContext(EditorActionsContext)
  if (context === undefined) {
    throw new Error("useEditorActions must be used within an EditorActionsProvider")
  }
  return context
}

