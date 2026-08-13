"use client"

import { useEffect } from "react"

const EMBED_ROOT_ID = "smrt-embed-root"
const HEIGHT_BUFFER_PX = 8

export function postEmbedHeight() {
  if (typeof window === "undefined") return

  const root = document.getElementById(EMBED_ROOT_ID)
  const measured = root
    ? root.getBoundingClientRect().height
    : Math.min(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      )

  // Prefer content height so a tall Framer iframe doesn't report empty space below.
  const height = Math.ceil(measured + HEIGHT_BUFFER_PX)
  window.parent.postMessage({ type: "smrt-embed-resize", height }, "*")
}

export function EmbedResizer() {
  useEffect(() => {
    postEmbedHeight()

    const root = document.getElementById(EMBED_ROOT_ID) ?? document.body
    const resizeObserver = new ResizeObserver(() => {
      postEmbedHeight()
    })
    resizeObserver.observe(root)

    const mutationObserver = new MutationObserver(() => {
      postEmbedHeight()
    })
    mutationObserver.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
    })

    window.addEventListener("load", postEmbedHeight)
    window.addEventListener("resize", postEmbedHeight)

    // Catch late layout after fonts / dropdowns / iframe loads
    const timers = [50, 200, 500, 1000].map((ms) => window.setTimeout(postEmbedHeight, ms))

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener("load", postEmbedHeight)
      window.removeEventListener("resize", postEmbedHeight)
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  return null
}
