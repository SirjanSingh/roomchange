import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileEdit } from "@/components/ProfileEdit";
import type { Profile } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/dashboard");

  return <ProfileEdit profile={profile as Profile} />;
}
