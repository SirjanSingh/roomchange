"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/listings", label: "Listings" },
  { href: "/offers", label: "Offers" },
  { href: "/queue", label: "Queue" },
  { href: "/profile", label: "Profile" },
];

export function Nav({
  email,
  hasProfile,
  isAdmin,
}: {
  email: string;
  hasProfile: boolean;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { counts, hasNewOffer } = useNotifications(hasProfile);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const allLinks = isAdmin
    ? [...links, { href: "/admin", label: "Admin" }]
    : links;

  const getBadge = (href: string) => {
    if (href === "/offers" && counts.incomingOffers > 0) {
      return (
        <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-red-500 text-white rounded-full">
          {counts.incomingOffers}
        </span>
      );
    }
    if (href === "/listings" && counts.newMatches > 0) {
      return (
        <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-blue-500 text-white rounded-full">
          {counts.newMatches}
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className="text-white font-bold text-lg mr-4 sm:mr-6"
              >
                RoomSwap
              </Link>
              {/* Desktop nav links */}
              {hasProfile && (
                <div className="hidden md:flex items-center gap-1">
                  {allLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center ${
                        pathname === link.href ||
                        pathname.startsWith(link.href + "/")
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      {link.label}
                      {getBadge(link.href)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-xs hidden sm:inline">
                {email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-white text-sm transition-colors hidden md:inline"
              >
                Sign Out
              </button>
              {/* Hamburger button (mobile) */}
              {hasProfile && (
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="md:hidden text-gray-400 hover:text-white p-1"
                  aria-label="Toggle menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {menuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && hasProfile && (
          <div className="md:hidden border-t border-gray-800 bg-gray-900 px-4 pb-4 pt-2 space-y-1">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] flex items-center ${
                  pathname === link.href ||
                  pathname.startsWith(link.href + "/")
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {link.label}
                {getBadge(link.href)}
              </Link>
            ))}
            <button
              onClick={() => {
                setMenuOpen(false);
                handleSignOut();
              }}
              className="block w-full text-left px-3 py-2.5 text-gray-400 hover:text-white text-sm rounded-lg hover:bg-gray-800 transition-colors min-h-[44px]"
            >
              Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* New offer toast */}
      {hasNewOffer && (
        <div className="fixed top-16 right-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm animate-pulse">
          New offer received!
        </div>
      )}
    </>
  );
}
