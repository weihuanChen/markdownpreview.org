"use client"

import { Streamdown } from "streamdown"

interface MarkdownPreviewProps {
  content: string
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="px-8 py-6 leading-relaxed">
      <Streamdown parseIncompleteMarkdown={true} shikiTheme={["monokai", "monokai"]} controls={true}>
        {content}
      </Streamdown>
    </div>
  )
}
