import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Extra domain check
  if (user.email && !user.email.endsWith("@lnmiit.ac.in")) {
    await supabase.auth.signOut();
    redirect("/auth?error=Only @lnmiit.ac.in emails are allowed");
  }

  // Check if profile exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isAdminUser = profile?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-950">
      <Nav
        email={user.email || ""}
        hasProfile={!!profile}
        isAdmin={isAdminUser}
      />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
