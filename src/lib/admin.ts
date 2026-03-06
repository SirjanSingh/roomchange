import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "23ucs715@lnmiit.ac.in";

export { ADMIN_EMAIL };

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role === "admin";
}

export async function requireAdmin(userId: string): Promise<boolean> {
  const admin = await isAdmin(userId);
  if (!admin) throw new Error("Unauthorized: admin access required");
  return true;
}
