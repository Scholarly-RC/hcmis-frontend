import {
  ArrowRight,
  BookOpenText,
  ChevronRight,
  ExternalLink,
  FileText,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { DocsNav } from "@/components/docs/docs-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type DocPage,
  docsCategories,
  docsPages,
  getDocBySlug,
  getDocCategory,
  getDocHref,
} from "@/lib/docs";

type DocsShellProps = {
  page: DocPage;
  children: ReactNode;
};

export function DocsShell({ page, children }: DocsShellProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border/70 bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  <BookOpenText className="mr-1 size-3.5" />
                  Help Center
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  Open to Everyone
                </Badge>
              </div>
              <div>
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
                  HCMIS Help Center
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Simple guides for employees, approvers, and HR users. This
                  area explains how to use the app. Internal setup and sensitive
                  admin details are not included here.
                </p>
              </div>
            </div>

            <Button asChild variant="outline">
              <Link href="/login">
                <ExternalLink className="size-4" />
                Go to Sign In
              </Link>
            </Button>
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
              <DocsNav currentPage={page} />
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    What Is Included
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    These guides explain what users can do in the app and how
                    the workflow works. They do not include secrets, setup
                    steps, or private recovery procedures.
                  </p>
                </div>
              </div>
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
    .map((slug) => getDocBySlug(slug))
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

      {page.tasks?.length ? (
        <section className="space-y-4">
          <div>
            <h3 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              Follow These Steps
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use these instructions for the most common tasks on this page.
            </p>
          </div>

          {page.tasks.map((task) => (
            <Card
              key={task.title}
              className="border-border/70 bg-card/85 shadow-lg shadow-black/5"
            >
              <CardHeader className="pb-3">
                <CardTitle>{task.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.intro ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {task.intro}
                  </p>
                ) : null}

                <ol className="space-y-3">
                  {task.steps.map((step, index) => (
                    <li
                      key={`${task.title}-${step}`}
                      className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm leading-6 text-muted-foreground"
                    >
                      <span className="mr-2 font-semibold text-foreground">
                        {index + 1}.
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>

                {task.outcome ? (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Result:
                    </span>{" "}
                    {task.outcome}
                  </div>
                ) : null}

                {task.notes?.length ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      Important
                    </p>
                    <ul className="space-y-2">
                      {task.notes.map((note) => (
                        <li
                          key={note}
                          className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm leading-6 text-muted-foreground"
                        >
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      <div className="space-y-4">
        {page.sections.map((section) => (
          <Card
            key={section.title}
            className="border-border/70 bg-card/85 shadow-lg shadow-black/5"
          >
            <CardHeader className="pb-3">
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm leading-6 text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}

              {section.bullets ? (
                <ul className="space-y-2">
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm leading-6 text-muted-foreground"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

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
            {docsPages.length} Guides
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
        {docsCategories.map((category) => {
          const pages = docsPages.filter(
            (docPage) => docPage.categoryId === category.id,
          );
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
