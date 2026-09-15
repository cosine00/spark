import { QuartzComponent, QuartzComponentProps } from "./types"
import { resolveRelative } from "../util/path"

// Opt in per page; normal articles and their display dates remain unchanged.
export function recentUpdatesOptions(fileData: QuartzComponentProps["fileData"]) {
  const value = fileData.frontmatter?.recentUpdates
  return value && typeof value === "object"
    ? (value as { limit?: number; excludeFolders?: string[] })
    : undefined
}

const RecentUpdates: QuartzComponent = ({ fileData, allFiles, cfg }) => {
  const options = recentUpdatesOptions(fileData)
  const limit = Math.max(1, Math.floor(Number(options?.limit) || 6))
  const excluded = (options?.excludeFolders ?? ["picks"]).map((folder) =>
    folder.replace(/^\/+|\/+$/g, "").toLowerCase(),
  )
  const timestamp = (page: QuartzComponentProps["fileData"]) => {
    const date = page.dates?.modified ?? page.dates?.created
    const time = date ? new Date(date).getTime() : 0
    return Number.isFinite(time) ? time : 0
  }
  const pages = allFiles
    .filter((page) => {
      const slug = page.slug?.toLowerCase()
      return (
        slug &&
        page.slug !== fileData.slug &&
        slug !== "index" &&
        slug !== "index-list" &&
        !slug.endsWith("/index") &&
        !page.frontmatter?.unlisted &&
        !page.frontmatter?.draft &&
        !recentUpdatesOptions(page) &&
        !excluded.some((folder) => slug === folder || slug.startsWith(`${folder}/`))
      )
    })
    .sort((a, b) => timestamp(b) - timestamp(a) || String(a.slug).localeCompare(String(b.slug)))
    .slice(0, limit)

  return (
    <section class="recent-updates" aria-label="最近更新的文章">
      <h2>最近更新</h2>
      <ul>
        {pages.map((page) => (
          <li>
            {timestamp(page) > 0 && (
              <time dateTime={new Date(timestamp(page)).toISOString()}>
                {new Intl.DateTimeFormat(cfg.locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "Asia/Shanghai",
                }).format(new Date(timestamp(page)))}
              </time>
            )}
            <a class="internal" href={resolveRelative(fileData.slug!, page.slug!)}>
              {page.frontmatter?.title ?? page.slug}
            </a>
          </li>
        ))}
      </ul>
      {pages.length === 0 && <p>暂无更新。</p>}
    </section>
  )
}

export default RecentUpdates
