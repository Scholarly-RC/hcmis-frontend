"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  type DocCategory,
  type DocCategoryId,
  type DocPage,
  getDocHref,
} from "@/lib/docs-schema";
import { cn } from "@/utils/cn";

type DocsNavProps = {
  categories: readonly DocCategory[];
  currentPage: DocPage;
  pagesByCategory: Record<DocCategoryId, DocPage[]>;
};

function normalize(value: string) {
  return value.toLowerCase().trim();
}

export function DocsNav({
  categories,
  currentPage,
  pagesByCategory,
}: DocsNavProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalize(query);

  const filteredCategories = useMemo(() => {
    return categories
      .map((category) => {
        const pages = (pagesByCategory[category.id] ?? []).filter((page) => {
          if (normalizedQuery.length === 0) {
            return true;
          }

          const searchable = normalize(
            `${page.title} ${page.description} ${page.summary} ${page.audience}`,
          );
          return searchable.includes(normalizedQuery);
        });

        return {
          category,
          pages,
        };
      })
      .filter(({ pages }) => pages.length > 0);
  }, [categories, normalizedQuery, pagesByCategory]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="docs-search" className="sr-only">
          Search documentation
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="docs-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guides..."
            className="rounded-xl border-border/70 bg-background/80 pl-9 shadow-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredCategories.map(({ category, pages }, categoryIndex) => (
          <div key={category.id} className="space-y-2">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {category.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {category.description}
              </p>
            </div>

            <div className="space-y-1">
              {pages.map((page) => {
                const active =
                  page.slug.length === currentPage.slug.length &&
                  page.slug.every(
                    (part, index) => part === currentPage.slug[index],
                  );

                return (
                  <Link
                    key={getDocHref(page.slug)}
                    href={getDocHref(page.slug)}
                    className={cn(
                      "block rounded-xl border px-3 py-2 text-sm transition-colors",
                      active
                        ? "border-primary/30 bg-primary/5 text-foreground"
                        : "border-border/60 bg-background/70 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    {page.title}
                  </Link>
                );
              })}
            </div>

            {categoryIndex < filteredCategories.length - 1 ? (
              <Separator />
            ) : null}
          </div>
        ))}

        {filteredCategories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
            No guides match "{query.trim()}".
          </div>
        ) : null}
      </div>
    </div>
  );
}
