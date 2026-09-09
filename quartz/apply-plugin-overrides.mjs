import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { spawnSync } from "node:child_process"

const root = process.cwd()

function update(relativePath, before, after) {
  const filePath = path.join(root, relativePath)
  const source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n")

  if (source.includes(after)) {
    return
  }

  if (!source.includes(before)) {
    throw new Error(`无法套用 Quartz 定制：${relativePath} 的上游代码与锁定版本不一致`)
  }

  fs.writeFileSync(filePath, source.replace(before, after), "utf8")
  console.log(`已套用 Quartz 定制：${relativePath}`)
}

function buildPlugin(name) {
  const isWindows = process.platform === "win32"
  const command = isWindows ? (process.env.ComSpec ?? "cmd.exe") : "npm"
  const args = isWindows ? ["/d", "/s", "/c", "npm.cmd run build"] : ["run", "build"]
  const pluginPath = path.join(root, ".quartz", "plugins", name)
  const result = spawnSync(command, args, {
    cwd: pluginPath,
    stdio: "inherit",
  })

  if (result.status !== 0) {
    throw new Error(`Quartz 插件编译失败：${name}`)
  }
}

update(
  ".quartz/plugins/explorer/src/components/Explorer.tsx",
  `        <button
          type="button"
          class="title-button explorer-toggle desktop-explorer"
          data-mobile={false}
          aria-expanded={true}
        >
          <h2>{title}</h2>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="5 8 14 8"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="fold"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>`,
  `        <div class="explorer-title-row desktop-explorer">
          <a href="/index-list" class="explorer-index-link internal">
            <h2>{title}</h2>
          </a>
          <button
            type="button"
            class="title-button explorer-toggle desktop-explorer"
            data-mobile={false}
            aria-expanded={true}
            aria-label="展开或收起目录"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="5 8 14 8"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="fold"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>`,
)

update(
  ".quartz/plugins/explorer/src/components/styles/explorer.scss",
  `.explorer button.desktop-explorer {
  display: flex;
}
@media all and (max-width: 800px) {`,
  `.explorer button.desktop-explorer {
  display: flex;
}
.explorer .explorer-title-row {
  display: flex;
  align-items: center;
}
.explorer .explorer-index-link {
  color: var(--dark);
  text-decoration: none;
}
.explorer .explorer-index-link:hover {
  color: var(--secondary);
}
.explorer .explorer-index-link h2 {
  display: inline-block;
  font-size: 1rem;
  margin: 0;
}
@media all and (max-width: 800px) {`,
)

update(
  ".quartz/plugins/explorer/src/components/styles/explorer.scss",
  `  .explorer button.desktop-explorer {
    display: none;
  }
}`,
  `  .explorer button.desktop-explorer {
    display: none;
  }
  .explorer .explorer-title-row {
    display: none;
  }
}`,
)

update(
  ".quartz/plugins/folder-page/src/pageType.ts",
  `  return slug.endsWith("/index");`,
  `  return slug === "index-list" || slug.endsWith("/index");`,
)

update(
  ".quartz/plugins/folder-page/src/pageType.ts",
  `      return virtualPages;`,
  `      virtualPages.push({
        slug: "index-list" as unknown as FullSlug,
        title: "今是昨非",
        data: { unlisted: true },
      });

      return virtualPages;`,
)

update(
  ".quartz/plugins/folder-page/src/components/FolderContent.tsx",
  `    const trie = ctx?.trie;
    let allPagesInFolder: PageEntry[];

    if (trie) {
      const folder = trie.findNode(slug.split("/"));
      if (!folder) return null;
      allPagesInFolder = pagesFromTrie(folder, options.showSubfolders);
    } else {
      allPagesInFolder = pagesFromAllFiles(allFiles ?? [], slug, options.showSubfolders);
    }`,
  `    const trie = ctx?.trie;
    let allPagesInFolder: PageEntry[];
    const isRootListing = slug === "index-list";

    if (trie) {
      const folder = trie.findNode(isRootListing ? [] : slug.split("/"));
      if (!folder) return null;
      allPagesInFolder = isRootListing
        ? folder.children
            .filter((node) => !node.isFolder && node.data !== null)
            .map((node) => node.data as PageEntry)
            .filter((page) => page.unlisted !== true)
        : pagesFromTrie(folder, options.showSubfolders);
    } else {
      allPagesInFolder = isRootListing
        ? (allFiles as PageEntry[]).filter((page) => {
            const pageSlug = page.slug;
            return (
              page.unlisted !== true &&
              typeof pageSlug === "string" &&
              pageSlug !== "index" &&
              pageSlug !== "index-list" &&
              !pageSlug.includes("/")
            );
          })
        : pagesFromAllFiles(allFiles ?? [], slug, options.showSubfolders);
    }`,
)

update(
  ".quartz/plugins/folder-page/src/components/PageList.tsx",
  `        day: "2-digit",`,
  `        day: "numeric",`,
)

update(
  ".quartz/plugins/folder-page/src/components/PageList.tsx",
  `      {date.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}`,
  `      {date
        .toLocaleDateString(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
        .replace(/月0(?=\\d日)/u, "月")}`,
)

update(
  ".quartz/plugins/tag-page/src/components/PageList.tsx",
  `        day: "2-digit",`,
  `        day: "numeric",`,
)

update(
  ".quartz/plugins/tag-page/src/components/PageList.tsx",
  `      {date.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}`,
  `      {date
        .toLocaleDateString(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
        .replace(/月0(?=\\d日)/u, "月")}`,
)

update(
  ".quartz/plugins/content-meta/src/util/date.tsx",
  `  return <time datetime={date.toISOString()}>{formatDate(date, locale)}</time>;`,
  `  const formatted = formatDate(date, locale).replace(/月0(?=\\d日)/u, "月");
  return <time datetime={date.toISOString()}>{formatted}</time>;`,
)

for (const plugin of ["explorer", "folder-page", "tag-page", "content-meta"]) {
  buildPlugin(plugin)
}
