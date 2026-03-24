import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME, fetchCurrentUser } from "@/lib/auth-server";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    const user = await fetchCurrentUser(token);

    if (user) {
      redirect("/dashboard");
    }
  }

  redirect("/login");
}
