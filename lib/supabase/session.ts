import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "./server";

export type SessionContext = {
  /** null while the backend isn't connected yet (no env vars). */
  supabase: SupabaseClient | null;
  /** null when nobody is signed in. Verified on the server, not read from a cookie. */
  userId: string | null;
  userEmail: string;
  isStaff: boolean;
};

/**
 * The one place every protected page starts.
 *
 * Identity is verified server-side with getUser(), and staff status is a real
 * database lookup — never a prop, a cookie or a query string. Pages use it as:
 *
 *   const { supabase, userId, isStaff } = await getSessionContext();
 *   if (!supabase) return <NotConnectedPage />;
 *   if (!userId) redirect("/login");
 */
export async function getSessionContext(): Promise<SessionContext> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { supabase: null, userId: null, userEmail: "", isStaff: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { supabase, userId: null, userEmail: "", isStaff: false };
  }

  return {
    supabase,
    userId: user.id,
    userEmail: user.email ?? "",
    isStaff: await isStaff(supabase, user.id),
  };
}

/**
 * "Is this user on the staff allowlist?" RLS only lets a caller read their own
 * staff_members row, so this can never be used to enumerate other staff.
 */
export async function isStaff(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("staff_members")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}
