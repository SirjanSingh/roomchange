"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/listings", label: "Listings" },
  { href: "/offers", label: "Offers" },
  { href: "/queue", label: "Queue" },
];

export function Nav({
  email,
  hasProfile,
}: {
  email: string;
  hasProfile: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="text-white font-bold text-lg mr-6"
            >
              RoomSwap
            </Link>
            {hasProfile &&
              links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    pathname === link.href ||
                    pathname.startsWith(link.href + "/")
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs hidden sm:inline">
              {email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
