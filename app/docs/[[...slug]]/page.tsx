import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsArticle, DocsShell } from "@/components/docs/docs-shell";
import { getDocBySlug } from "@/lib/docs";

type DocsPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

export async function generateMetadata({
  params,
}: DocsPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug ?? [];
  const page = getDocBySlug(slug);

  if (!page) {
    return {
      title: "Documentation",
    };
  }

  return {
    title: `${page.title} | Docs`,
    description: page.description,
  };
}

export default async function DocsPage({ params }: DocsPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug ?? [];
  const page = getDocBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <DocsShell page={page}>
      <DocsArticle page={page} />
    </DocsShell>
  );
}
