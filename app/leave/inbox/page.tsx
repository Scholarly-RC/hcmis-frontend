import { redirect } from "next/navigation";

type SearchParams =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

export default async function LeaveInboxRedirectPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = (await searchParams) ?? {};
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        query.append(key, entry);
      }
      continue;
    }
    if (typeof value === "string") {
      query.set(key, value);
    }
  }

  const serialized = query.toString();
  redirect(
    serialized.length > 0 ? `/requests/inbox?${serialized}` : "/requests/inbox",
  );
}
