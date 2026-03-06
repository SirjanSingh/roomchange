import { createClient } from "@/lib/supabase/server";

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
