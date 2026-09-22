import {
  BriefcaseBusinessIcon,
  ChevronRightIcon,
  LogOutIcon,
  MenuIcon,
  Settings2Icon,
} from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/jobs/actions";

import { JevMatchBrand } from "./jev-match-brand";

type RecruiterShellProps = {
  active: "jobs" | "settings";
  children: React.ReactNode;
  email: string | null;
};

const navigation = [
  { href: "/jobs", icon: BriefcaseBusinessIcon, key: "jobs", label: "Jobs" },
  { href: "/settings", icon: Settings2Icon, key: "settings", label: "Settings" },
] as const;

function AccountSummary({ email }: { email: string | null }) {
  const initials = (email?.slice(0, 2) ?? "JM").toUpperCase();

  return (
    <div className="border-t pt-4">
      <Link
        className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href="/settings"
      >
        <Avatar size="lg">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-foreground">Account</span>
          <span className="block truncate text-xs text-muted-foreground">
            {email ?? "Signed-in account"}
          </span>
        </span>
        <ChevronRightIcon aria-hidden="true" className="size-4 text-muted-foreground" />
      </Link>
      <form action={signOut} className="mt-2">
        <Button className="w-full justify-start" size="sm" type="submit" variant="ghost">
          <LogOutIcon data-icon="inline-start" />
          Sign out
        </Button>
      </form>
    </div>
  );
}

function NavigationLinks({ active }: Pick<RecruiterShellProps, "active">) {
  return (
    <nav aria-label="Primary navigation" className="grid gap-2">
      {navigation.map(({ href, icon: Icon, key, label }) => {
        const isActive = active === key;
        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            href={href}
            key={key}
          >
            <Icon aria-hidden="true" className="size-[18px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function RecruiterShell({ active, children, email }: RecruiterShellProps) {
  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 lg:grid lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-4">
      <aside className="hidden min-h-[calc(100vh-2rem)] flex-col rounded-[18px] border bg-surface p-4 lg:flex">
        <div className="px-2 pt-2 pb-10">
          <JevMatchBrand />
        </div>
        <NavigationLinks active={active} />
        <div className="mt-auto">
          <AccountSummary email={email} />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="mb-6 flex items-center justify-between rounded-[18px] border bg-surface px-4 py-3 lg:hidden">
          <JevMatchBrand />
          <details className="relative">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <MenuIcon aria-hidden="true" className="size-5" />
              <span className="sr-only">Open navigation</span>
            </summary>
            <div className="absolute top-12 right-0 z-20 w-72 rounded-xl border bg-surface p-3 shadow-[0_18px_48px_-24px_rgba(15,23,42,0.35)]">
              <NavigationLinks active={active} />
              <div className="mt-3">
                <AccountSummary email={email} />
              </div>
            </div>
          </details>
        </header>
        <main className="mx-auto max-w-[1440px] px-1 pb-8 lg:px-4 lg:pt-4">{children}</main>
      </div>
    </div>
  );
}
