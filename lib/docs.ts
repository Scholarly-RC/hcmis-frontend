import "server-only";

import fs from "node:fs";
import path from "node:path";
import {
  type DocCategoryId,
  type DocContentBlock,
  type DocPage,
  type DocSection,
  docsCategories,
} from "@/lib/docs-schema";

type Frontmatter = {
  title: string;
  description: string;
  category: DocCategoryId;
  audience: string;
  summary: string;
  related: string[];
};

const DOCS_ROOT = path.join(process.cwd(), "content", "docs");

function parseScalar(rawValue: string) {
  const value = rawValue.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseFrontmatter(source: string) {
  if (!source.startsWith("---\n")) {
    return {
      frontmatter: {} as Partial<Frontmatter>,
      body: source,
    };
  }

  const lines = source.split(/\r?\n/);
  const frontmatter: Record<string, string | string[]> = {};
  let index = 1;

  while (index < lines.length && lines[index] !== "---") {
    const line = lines[index];

    if (line.trim().length === 0) {
      index += 1;
      continue;
    }

    const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!match) {
      throw new Error(`Invalid frontmatter line: ${line}`);
    }

    const [, key, rawValue] = match;

    if (rawValue.trim().length > 0) {
      frontmatter[key] = parseScalar(rawValue);
      index += 1;
      continue;
    }

    const items: string[] = [];
    index += 1;

    while (index < lines.length) {
      const itemLine = lines[index];
      const itemMatch = itemLine.match(/^\s*-\s+(.*)$/);
      if (!itemMatch) {
        break;
      }

      items.push(parseScalar(itemMatch[1]));
      index += 1;
    }

    frontmatter[key] = items;
  }

  if (lines[index] !== "---") {
    throw new Error("Unclosed frontmatter block");
  }

  return {
    frontmatter: frontmatter as Partial<Frontmatter>,
    body: lines
      .slice(index + 1)
      .join("\n")
      .trim(),
  };
}

function parseMarkdownSections(body: string) {
  const lines = body.split(/\r?\n/);
  const sections: DocSection[] = [];
  let currentSection: DocSection | null = null;
  let index = 0;

  const ensureSection = () => {
    if (!currentSection) {
      currentSection = {
        title: "Overview",
        blocks: [],
      };
      sections.push(currentSection);
    }

    return currentSection;
  };

  while (index < lines.length) {
    const line = lines[index].trimEnd();
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      currentSection = {
        title: trimmed.slice(3).trim(),
        blocks: [],
      };
      sections.push(currentSection);
      index += 1;
      continue;
    }

    if (trimmed.startsWith("> ")) {
      const noteLines: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith("> ")) {
        noteLines.push(lines[index].trim().slice(2).trim());
        index += 1;
      }

      ensureSection().blocks.push({
        type: "note",
        text: noteLines.join(" "),
      });
      continue;
    }

    if (trimmed.startsWith("VIDEO:")) {
      const url = trimmed.slice("VIDEO:".length).trim();

      if (url.length === 0) {
        throw new Error("VIDEO block requires a URL");
      }

      ensureSection().blocks.push({
        type: "video",
        url,
      });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("- ")) {
      const items: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2).trim());
        index += 1;
      }

      ensureSection().blocks.push({
        type: "bullet-list",
        items,
      });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }

      ensureSection().blocks.push({
        type: "numbered-list",
        items,
      });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const candidate = lines[index].trim();

      if (
        candidate.length === 0 ||
        candidate.startsWith("## ") ||
        candidate.startsWith("> ") ||
        candidate.startsWith("VIDEO:") ||
        candidate.startsWith("- ") ||
        /^\d+\.\s+/.test(candidate)
      ) {
        break;
      }

      paragraphLines.push(candidate);
      index += 1;
    }

    ensureSection().blocks.push({
      type: "paragraph",
      text: paragraphLines.join(" "),
    });
  }

  return sections;
}

function readDocFile(filePath: string): DocPage {
  const source = fs.readFileSync(filePath, "utf8");
  const { frontmatter, body } = parseFrontmatter(source);
  const slugPath = path.relative(DOCS_ROOT, filePath).replace(/\.md$/, "");
  const slugParts = slugPath.split(path.sep);
  const slug =
    slugParts.length > 0 && slugParts[slugParts.length - 1] === "index"
      ? slugParts.slice(0, -1)
      : slugParts;

  if (
    !frontmatter.title ||
    !frontmatter.description ||
    !frontmatter.category ||
    !frontmatter.audience ||
    !frontmatter.summary
  ) {
    throw new Error(`Missing required frontmatter in ${filePath}`);
  }

  const related = Array.isArray(frontmatter.related)
    ? frontmatter.related.map((value) => value.split("/").filter(Boolean))
    : [];

  return {
    slug,
    title: frontmatter.title,
    description: frontmatter.description,
    categoryId: frontmatter.category,
    audience: frontmatter.audience,
    summary: frontmatter.summary,
    related,
    sections: parseMarkdownSections(body),
  };
}

function walkDocsDirectory(directory: string): string[] {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const filePaths: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      filePaths.push(...walkDocsDirectory(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      filePaths.push(fullPath);
    }
  }

  return filePaths;
}

function sortDocs(pages: DocPage[]) {
  const categoryOrder = new Map<DocCategoryId, number>(
    docsCategories.map((category, index) => [category.id, index]),
  );

  return [...pages].sort((left, right) => {
    if (left.slug.length === 0) {
      return -1;
    }

    if (right.slug.length === 0) {
      return 1;
    }

    const leftCategory = categoryOrder.get(left.categoryId) ?? 999;
    const rightCategory = categoryOrder.get(right.categoryId) ?? 999;

    if (leftCategory !== rightCategory) {
      return leftCategory - rightCategory;
    }

    return left.title.localeCompare(right.title);
  });
}

const docsPages = sortDocs(walkDocsDirectory(DOCS_ROOT).map(readDocFile));
const docsPagesFlat = [...docsPages];

export { docsCategories, docsPages };
export type { DocPage, DocSection, DocContentBlock };

export function getDocCategory(categoryId: DocCategoryId) {
  return docsCategories.find((category) => category.id === categoryId);
}

export function getDocBySlug(slug: readonly string[]) {
  return docsPagesFlat.find(
    (page) =>
      page.slug.length === slug.length &&
      page.slug.every((part, index) => part === slug[index]),
  );
}

export function getCategoryPages(categoryId: DocCategoryId) {
  return docsPagesFlat.filter((page) => page.categoryId === categoryId);
}
