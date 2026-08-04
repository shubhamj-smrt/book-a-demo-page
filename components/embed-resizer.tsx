"use client"

import { useEffect } from "react"

function postEmbedHeight() {
  const height = Math.ceil(document.documentElement.scrollHeight)
  window.parent.postMessage({ type: "smrt-embed-resize", height }, "*")
}

export function EmbedResizer() {
  useEffect(() => {
    postEmbedHeight()

    const resizeObserver = new ResizeObserver(() => {
      postEmbedHeight()
    })

    resizeObserver.observe(document.body)

    window.addEventListener("load", postEmbedHeight)
    window.addEventListener("resize", postEmbedHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("load", postEmbedHeight)
      window.removeEventListener("resize", postEmbedHeight)
    }
  }, [])

  return null
}
