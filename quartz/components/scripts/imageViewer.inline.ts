const imageIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="8.5" cy="9" r="1.5"></circle><path d="m4 17 4.5-4.5 3.5 3 2.5-2.5 5.5 5"></path></svg>`

function imageUrl(image: HTMLImageElement): string {
  return image.currentSrc || image.src
}

function isArticleImage(image: HTMLImageElement): boolean {
  return (
    !image.closest(".article-image-preview, .article-image-viewer") &&
    !image.matches(".avatar, .tk-avatar-img") &&
    !/emotion/i.test(image.getAttribute("src") ?? "")
  )
}

function isFullArticleImage(image: HTMLImageElement): boolean {
  try {
    const source = image.getAttribute("src") ?? image.src
    return new URL(source, document.baseURI).hash.toLowerCase() === "#full"
  } catch {
    return false
  }
}

function hasReadableText(element: Element | null): boolean {
  if (!element) return false

  const copy = element.cloneNode(true) as Element
  copy
    .querySelectorAll("img, script, style, .article-image-trigger")
    .forEach((node) => node.remove())
  return (copy.textContent ?? "").replace(/\s+/g, "").length > 0
}

function nearestTextBlock(
  image: HTMLImageElement,
  article: HTMLElement,
  textBlocks: Element[],
): Element | null {
  const ownBlock = image.closest("p, li, blockquote")
  if (ownBlock && article.contains(ownBlock) && hasReadableText(ownBlock)) return ownBlock

  let nearest: Element | null = null
  for (const block of textBlocks) {
    if (block === image || block.contains(image)) continue
    if (block.compareDocumentPosition(image) & Node.DOCUMENT_POSITION_FOLLOWING) {
      nearest = block
    } else {
      break
    }
  }
  return nearest
}

function openImageViewer(urls: string[], selectedUrl: string) {
  let index = Math.max(0, urls.indexOf(selectedUrl))
  const previousOverflow = document.documentElement.style.overflow
  const viewer = document.createElement("div")
  viewer.className = "article-image-viewer"
  viewer.setAttribute("role", "dialog")
  viewer.setAttribute("aria-modal", "true")
  viewer.setAttribute("aria-label", "图片查看器")
  viewer.innerHTML = `
    <button class="article-image-backdrop" type="button" aria-label="关闭图片"></button>
    <div class="article-image-stage"><img alt="" /></div>
    <div class="article-image-tools">
      <span class="article-image-position"></span>
      <div class="article-image-navigation">
        <button type="button" data-image-action="previous" aria-label="上一张">‹</button>
        <button type="button" data-image-action="next" aria-label="下一张">›</button>
      </div>
      <button type="button" data-image-action="close" aria-label="关闭">×</button>
    </div>`

  const image = viewer.querySelector(".article-image-stage img") as HTMLImageElement
  const position = viewer.querySelector(".article-image-position") as HTMLElement
  const closeButton = viewer.querySelector('[data-image-action="close"]') as HTMLButtonElement

  const render = () => {
    image.src = urls[index]
    position.textContent = `${index + 1}/${urls.length}`
  }

  const close = () => {
    window.removeEventListener("keydown", onKeydown)
    document.documentElement.style.overflow = previousOverflow
    viewer.classList.add("is-closing")
    window.setTimeout(() => viewer.remove(), 180)
  }

  const step = (amount: number) => {
    index = (index + amount + urls.length) % urls.length
    render()
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") close()
    if (event.key === "ArrowLeft") step(-1)
    if (event.key === "ArrowRight") step(1)
  }

  viewer.addEventListener("click", (event) => {
    const target = event.target as Element
    if (target.closest(".article-image-backdrop, [data-image-action='close']")) close()
    if (target.closest("[data-image-action='previous']")) step(-1)
    if (target.closest("[data-image-action='next']")) step(1)
  })

  if (urls.length < 2) {
    viewer.querySelector(".article-image-navigation")?.remove()
  }

  document.body.appendChild(viewer)
  document.documentElement.style.overflow = "hidden"
  window.addEventListener("keydown", onKeydown)
  render()
  closeButton.focus()
}

function makeImageTrigger(images: HTMLImageElement[], articleImages: HTMLImageElement[]) {
  const button = document.createElement("button")
  button.type = "button"
  button.className = "article-image-trigger"
  button.dataset.tooltip = "查看图片"
  button.setAttribute("aria-label", `查看${images.length}张图片`)
  button.innerHTML = `${imageIcon}${
    images.length > 1 ? `<span class="article-image-count">+${images.length - 1}</span>` : ""
  }<span class="article-image-preview" aria-hidden="true"><img alt="" loading="lazy" decoding="async" /></span>`

  const preview = button.querySelector(".article-image-preview img") as HTMLImageElement
  preview.src = imageUrl(images[0])
  button.addEventListener("click", () => {
    openImageViewer(articleImages.map(imageUrl), imageUrl(images[0]))
  })
  return button
}

function setupArticleImages() {
  const article = document.querySelector(".center article") as HTMLElement | null
  if (!article || article.dataset.imageTriggersReady === "true") return

  const articleImages = Array.from(article.querySelectorAll("img")).filter(isArticleImage)
  if (articleImages.length === 0) return
  article.dataset.imageTriggersReady = "true"

  const fullImages = articleImages.filter(isFullArticleImage)
  for (const image of fullImages) {
    image.classList.add("article-image-full")
    image.tabIndex = 0
    image.setAttribute("role", "button")
    image.setAttribute("aria-label", image.alt ? `查看图片：${image.alt}` : "查看图片")

    const open = () => openImageViewer(articleImages.map(imageUrl), imageUrl(image))
    image.addEventListener("click", open)
    image.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        open()
      }
    })
  }

  const textBlocks = Array.from(article.querySelectorAll("p, li, blockquote")).filter(
    hasReadableText,
  )
  const groups: Array<{
    anchor: Element | null
    firstBlock: Element
    blocks: Element[]
    images: HTMLImageElement[]
  }> = []

  for (const image of articleImages.filter((image) => !isFullArticleImage(image))) {
    const block = image.closest("figure, p") ?? image
    const anchor = nearestTextBlock(image, article, textBlocks)
    let group = groups.find((item) => item.anchor === anchor)
    if (!group) {
      group = { anchor, firstBlock: block, blocks: [], images: [] }
      groups.push(group)
    }
    if (!group.blocks.includes(block)) group.blocks.push(block)
    group.images.push(image)
    image.classList.add("article-image-source")
    image.hidden = true
  }

  for (const group of groups) {
    const trigger = makeImageTrigger(group.images, articleImages)
    if (group.anchor) {
      group.anchor.append(document.createTextNode("\u00a0\u00a0"), trigger)
    } else {
      const holder = document.createElement("p")
      holder.className = "article-image-trigger-line"
      holder.appendChild(trigger)
      group.firstBlock.parentNode?.insertBefore(holder, group.firstBlock)
    }

    for (const block of group.blocks) {
      if (!hasReadableText(block)) {
        block.classList.add("article-image-source-block")
        ;(block as HTMLElement).hidden = true
      }
    }
  }
}

document.addEventListener("nav", setupArticleImages)
document.addEventListener("render", setupArticleImages)
