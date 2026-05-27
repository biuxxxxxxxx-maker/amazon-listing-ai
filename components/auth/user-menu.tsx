"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  clearWorkUpAuthState,
  getBrowserSupabase,
  syncWorkUpAuthCookies,
} from "@/lib/supabase-browser";

type UserMenuUser = {
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
};

type UserMenuProps = {
  className?: string;
};

function getDisplayName(user: UserMenuUser | null) {
  const fullName = user?.user_metadata?.full_name?.trim();

  if (fullName) {
    return fullName;
  }

  const emailPrefix = user?.email?.split("@")[0]?.trim();

  if (emailPrefix) {
    return emailPrefix;
  }

  return "User";
}

function getInitial(displayName: string) {
  return (displayName.trim()[0] || "U").toUpperCase();
}

export function UserMenu({ className }: UserMenuProps) {
  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserMenuUser | null>(null);

  useEffect(() => {
    if (!supabaseReady) {
      setUser(null);
      return;
    }

    let isMounted = true;
    const supabase = getBrowserSupabase();

    async function loadUser() {
      try {
        const { data } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (data.session?.access_token) {
          syncWorkUpAuthCookies(data.session);
          setUser(data.session.user as UserMenuUser);
          return;
        }

        setUser(null);
      } catch {
        if (isMounted) {
          setUser(null);
        }
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        syncWorkUpAuthCookies(session);
        setUser(session.user as UserMenuUser);
        return;
      }

      setUser(null);
      setIsOpen(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabaseReady]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function signOut() {
    try {
      await getBrowserSupabase().auth.signOut();
    } finally {
      clearWorkUpAuthState();
      setUser(null);
      setIsOpen(false);
      window.location.href = "/login";
    }
  }

  if (!user) {
    return null;
  }

  const displayName = getDisplayName(user);
  const initial = getInitial(displayName);

  return (
    <div ref={menuRef} className={cn("relative z-50", className)}>
      <button
        data-testid="user-menu-button"
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-10 max-w-[13rem] items-center gap-2 rounded-full border border-line bg-white px-2.5 pr-3 text-sm font-medium text-ink shadow-hairline transition hover:border-neutral-300 hover:bg-neutral-50"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-white">
          {initial}
        </span>
        <span className="min-w-0 truncate">{displayName}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-neutral-500 transition", {
            "rotate-180": isOpen,
          })}
        />
      </button>

      {isOpen ? (
        <div
          role="menu"
          data-testid="user-menu-dropdown"
          className="absolute right-0 top-12 w-56 overflow-hidden rounded-lg border border-line bg-white p-1.5 shadow-[0_18px_50px_rgba(23,23,23,0.14)]"
        >
          <Link
            href="/dashboard"
            role="menuitem"
            className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-neutral-100"
            onClick={() => setIsOpen(false)}
          >
            <LayoutDashboard className="size-4 text-neutral-500" />
            进入控制台
          </Link>
          {/* TODO: Add a dedicated /settings page before enabling this menu item. */}
          <button
            type="button"
            role="menuitem"
            disabled
            className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium text-neutral-400"
          >
            <Settings className="size-4" />
            个人设置
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium text-[#8a3b12] transition hover:bg-amberSoft"
            onClick={signOut}
          >
            <LogOut className="size-4" />
            退出
          </button>
        </div>
      ) : null}
    </div>
  );
}
