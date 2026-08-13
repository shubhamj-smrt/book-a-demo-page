"use client"

import { useEffect } from "react"

const EMBED_ROOT_ID = "smrt-embed-root"
const EMBED_CARD_ATTR = "data-smrt-embed-card"
const HEIGHT_BUFFER_PX = 4

export function postEmbedHeight() {
  if (typeof window === "undefined") return

  const card = document.querySelector<HTMLElement>(`[${EMBED_CARD_ATTR}]`)
  const root = document.getElementById(EMBED_ROOT_ID)
  const target = card ?? root

  const measured = target
    ? Math.max(target.scrollHeight, target.getBoundingClientRect().height)
    : Math.min(document.body.scrollHeight, document.documentElement.scrollHeight)

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
