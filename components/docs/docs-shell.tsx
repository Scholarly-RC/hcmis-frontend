import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  FileText,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { DocsNav } from "@/components/docs/docs-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type DocContentBlock,
  type DocPage,
  docsCategories,
  docsPages,
  getDocCategory,
} from "@/lib/docs";
import { type DocCategoryId, getDocHref } from "@/lib/docs-schema";

type DocsShellProps = {
  page: DocPage;
  children: ReactNode;
};

export function DocsShell({ page, children }: DocsShellProps) {
  const pagesByCategory = docsCategories.reduce(
    (result, category) => {
      result[category.id] = docsPages.filter(
        (docPage) =>
          docPage.categoryId === category.id && docPage.slug.length > 1,
      );
      return result;
    },
    {} as Record<DocCategoryId, DocPage[]>,
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border/70 bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <div>
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
                  Help Center
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Operational guides for HR, attendance, payroll, and
                  administrative workflows. This area focuses on account
                  records, access management, shift setup, and related tasks.
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              <ArrowLeft className="size-4" />
              Back to App
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8 lg:py-8">
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Browse Guides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DocsNav
                categories={docsCategories}
                currentPage={page}
                pagesByCategory={pagesByCategory}
              />
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}

type DocsArticleProps = {
  page: DocPage;
};

export function DocsArticle({ page }: DocsArticleProps) {
  if (page.slug.length === 0) {
    return <DocsHomePage page={page} />;
  }

  const relatedPages = page.related
    .map((slug) =>
      docsPages.find(
        (relatedPage) =>
          relatedPage.slug.length === slug.length &&
          relatedPage.slug.every((part, index) => part === slug[index]),
      ),
    )
    .filter((relatedPage) => relatedPage !== undefined);
  const category = getDocCategory(page.categoryId);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-lg shadow-black/5 sm:p-7">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/docs"
            className="transition-colors hover:text-foreground"
          >
            Docs
          </Link>
          {category ? (
            <>
              <ChevronRight className="size-3.5" />
              <span>{category.title}</span>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            <FileText className="mr-1 size-3.5" />
            Guide
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {page.audience}
          </Badge>
        </div>
        <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground">
          {page.title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {page.summary}
        </p>
      </section>

      <DocsSectionCards sections={page.sections} />

      {page.related.length > 0 ? (
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader className="pb-3">
            <CardTitle>Related Pages</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {relatedPages.map((relatedPage) => {
              const href = getDocHref(relatedPage.slug);
              return (
                <Link key={href} href={href} className="group">
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4 transition-colors group-hover:bg-muted/50">
                    <p className="font-medium text-foreground">
                      {relatedPage.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {relatedPage.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

type DocsHomePageProps = {
  page: DocPage;
};

function DocsHomePage({ page }: DocsHomePageProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-lg shadow-black/5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            <FileText className="mr-1 size-3.5" />
            Help Center
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {docsPages.filter((docPage) => docPage.slug.length > 0).length}{" "}
            Guides
          </Badge>
        </div>
        <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground">
          {page.title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {page.summary}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 lg:col-span-2">
          <DocsSectionCards sections={page.sections} />
        </div>

        {docsCategories.map((category) => {
          const pages = docsPages.filter(
            (docPage) =>
              docPage.categoryId === category.id && docPage.slug.length > 1,
          );

          if (pages.length === 0) {
            return null;
          }

          return (
            <Card
              key={category.id}
              className="border-border/70 bg-card/85 shadow-lg shadow-black/5"
            >
              <CardHeader className="pb-3">
                <CardTitle>{category.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  {category.description}
                </p>
                <div className="space-y-2">
                  {pages.slice(0, 4).map((relatedPage) => (
                    <Link
                      key={getDocHref(relatedPage.slug)}
                      href={getDocHref(relatedPage.slug)}
                      className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                    >
                      <span className="font-medium text-foreground">
                        {relatedPage.title}
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pages.length} guide{pages.length === 1 ? "" : "s"} in this
                  section.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

type DocsSectionCardsProps = {
  sections: DocPage["sections"];
};

function DocsSectionCards({ sections }: DocsSectionCardsProps) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Card
          key={section.title}
          className="border-border/70 bg-card/85 shadow-lg shadow-black/5"
        >
          <CardHeader className="pb-3">
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {section.blocks.map((block, index) => (
              <DocsBlock
                key={`${section.title}-${block.type}-${index}`}
                block={block}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

type DocsBlockProps = {
  block: DocContentBlock;
};

function DocsBlock({ block }: DocsBlockProps) {
  if (block.type === "paragraph") {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        {renderInlineText(block.text)}
      </p>
    );
  }

  if (block.type === "video") {
    const embed = getVideoEmbed(block.url);

    if (!embed) {
      return (
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="text-sm leading-6 text-muted-foreground">Video link:</p>
          <a
            href={block.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4"
          >
            Open video
            <ExternalLink className="size-4" />
          </a>
        </div>
      );
    }

    return (
      <div className="space-y-3 rounded-2xl border border-border/60 bg-background/70 p-4">
        <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/30">
          <div className="relative w-full pt-[56.25%]">
            <iframe
              src={embed.src}
              title="Documentation Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
        <a
          href={block.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4"
        >
          Open video in new tab
          <ExternalLink className="size-4" />
        </a>
      </div>
    );
  }

  if (block.type === "note") {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
        {renderInlineText(block.text)}
      </div>
    );
  }

  if (block.type === "bullet-list") {
    return (
      <ul className="space-y-2">
        {block.items.map((item) => (
          <li
            key={item}
            className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm leading-6 text-muted-foreground"
          >
            {renderInlineText(item)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ol className="space-y-2">
      {block.items.map((item, index) => (
        <li
          key={item}
          className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm leading-6 text-muted-foreground"
        >
          <span className="mr-2 font-semibold text-foreground">
            {index + 1}.
          </span>
          {renderInlineText(item)}
        </li>
      ))}
    </ol>
  );
}

function renderInlineText(text: string) {
  let partCount = 0;

  return text.split(/(`[^`]+`)/g).map((part) => {
    const key = `${part}-${partCount}`;
    partCount += 1;

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={key}>{part}</span>;
  });
}

function getVideoEmbed(url: string) {
  const normalizedUrl = url.trim();

  const youtubeWatchMatch = normalizedUrl.match(
    /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,})/,
  );
  if (youtubeWatchMatch) {
    return {
      src: `https://www.youtube.com/embed/${youtubeWatchMatch[1]}`,
    };
  }

  const youtubeShortMatch = normalizedUrl.match(
    /^https?:\/\/youtu\.be\/([A-Za-z0-9_-]{6,})/,
  );
  if (youtubeShortMatch) {
    return {
      src: `https://www.youtube.com/embed/${youtubeShortMatch[1]}`,
    };
  }

  const youtubeEmbedMatch = normalizedUrl.match(
    /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/,
  );
  if (youtubeEmbedMatch) {
    return {
      src: normalizedUrl,
    };
  }

  const driveFileMatch = normalizedUrl.match(
    /^https?:\/\/drive\.google\.com\/file\/d\/([^/]+)\//,
  );
  if (driveFileMatch) {
    return {
      src: `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`,
    };
  }

  const drivePreviewMatch = normalizedUrl.match(
    /^https?:\/\/drive\.google\.com\/file\/d\/([^/]+)\/preview/,
  );
  if (drivePreviewMatch) {
    return {
      src: normalizedUrl,
    };
  }

  return null;
}
