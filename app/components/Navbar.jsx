"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  const isActive = (href) => {
    return pathname === href;
  };

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* brand */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold">
                PM
              </div>
              <span className="hidden sm:inline font-semibold text-slate-800">
                PM Tools
              </span>
            </Link>
          </div>

          {/* desktop links */}
          <div className="hidden sm:flex sm:items-center sm:space-x-3">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                isActive("/") ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Home
            </Link>

            <Link
              href="/app/generate-plan"
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                isActive("/app/generate-plan")
                  ? "bg-indigo-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Generate Plan
            </Link>
          </div>

          {/* mobile menu button */}
          <div className="sm:hidden">
            <button
              onClick={() => setOpen((s) => !s)}
              aria-label="Toggle menu"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:bg-slate-100"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* mobile panel */}
      {open && (
        <div className="sm:hidden border-t bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/") ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Home
            </Link>

            <Link
              href="/app/generate-plan"
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/app/generate-plan")
                  ? "bg-indigo-600 text-white"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Generate Plan
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
