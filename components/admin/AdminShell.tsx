"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { siteConfig } from "@/data/site";
import {
  Bell,
  CalendarDays,
  CarFront,
  ChevronRight,
  CircleHelp,
  Gauge,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Percent,
  Settings,
  Star,
  UsersRound,
  X,
} from "lucide-react";

const navigation = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Fleet", href: "/admin/fleet", icon: CarFront },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarDays },
  { label: "Customers", href: "/admin/customers", icon: UsersRound },
  { label: "Deals", href: "/admin/deals", icon: Percent },
  { label: "Enquiries", href: "/admin/enquiries", icon: MessageSquareText },
  { label: "Testimonials", href: "/admin/testimonials", icon: Star },
  { label: "Gallery", href: "/admin/gallery", icon: Images },
  { label: "Settings", href: "/admin/settings", icon: Settings },
] as const;

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard overview",
  "/admin/fleet": "Vehicle management",
  "/admin/fleet/new": "Add a vehicle",
  "/admin/bookings": "Booking requests",
  "/admin/customers": "Customers",
  "/admin/deals": "Offers and discounts",
  "/admin/enquiries": "Contact enquiries",
  "/admin/testimonials": "Testimonials",
  "/admin/gallery": "Website gallery",
  "/admin/settings": "Website settings",
};

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [access, setAccess] = useState<"checking" | "locked" | "open">("checking");
  const [authError, setAuthError] = useState("");
  const [authPending, setAuthPending] = useState(false);
  const title =
    pageTitles[pathname] ??
    (pathname.endsWith("/edit") ? "Edit vehicle" : "Dashboard overview");

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/session", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        setAccess(result.authenticated ? "open" : "locked");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAuthError("Admin access could not be checked. Reload to try again.");
          setAccess("locked");
        }
      });
    return () => controller.abort();
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authPending) return;
    setAuthPending(true);
    setAuthError("");
    const password = new FormData(event.currentTarget).get("password");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.authenticated) {
        throw new Error(result?.error ?? "Unable to sign in.");
      }
      setAccess("open");
    } catch (cause) {
      setAuthError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setAuthPending(false);
    }
  }

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => undefined);
    setAccess("locked");
    setDrawerOpen(false);
  }

  if (access !== "open") {
    return (
      <div className="admin-app">
        <main className="admin-auth-screen">
          {access === "checking" ? (
            <p role="status">Checking admin access…</p>
          ) : (
            <section className="admin-auth-panel">
              <p className="admin-eyebrow">EPICDRIVE / ADMIN</p>
              <h1>Admin access</h1>
              <p>Sign in to manage the shared vehicle fleet.</p>
              <form onSubmit={signIn}>
                <label className="admin-field" htmlFor="admin-password">
                  <span>Password</span>
                  <input
                    autoComplete="current-password"
                    id="admin-password"
                    name="password"
                    required
                    type="password"
                  />
                </label>
                {authError ? <p className="admin-error" role="alert">{authError}</p> : null}
                <button className="admin-button admin-button--primary" disabled={authPending} type="submit">
                  {authPending ? "Signing in…" : "Sign in"}
                </button>
              </form>
              <Link href="/">Back to website</Link>
            </section>
          )}
        </main>
      </div>
    );
  }

  const sidebar = (
    <aside aria-label="Admin sidebar" className="admin-sidebar">
      <Link
        aria-label={`${siteConfig.brand.name} admin home`}
        className="admin-brand"
        href="/admin"
        onClick={() => setDrawerOpen(false)}
      >
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M8.25 14.5 12 8.25l3.75 6.25M9.75 12h4.5" />
        </svg>
        <span>{siteConfig.brand.name}</span>
        <small>ADMIN</small>
      </Link>
      <p className="admin-sidebar__label">WORKSPACE</p>
      <nav aria-label="Admin navigation" className="admin-nav">
        {navigation.map(({ href, icon: Icon, label }) => {
          const active =
            pathname === href ||
            (href !== "/admin" && pathname.startsWith(`${href}/`));
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`admin-nav__link${active ? " admin-nav__link--active" : ""}`}
              href={href}
              key={href}
              onClick={() => setDrawerOpen(false)}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {active ? <ChevronRight aria-hidden="true" size={15} /> : null}
            </Link>
          );
        })}
      </nav>
      <div className="admin-sidebar__bottom">
        <div className="admin-prototype-card">
          <Gauge aria-hidden="true" size={17} />
          <div>
            <strong>Fleet sync</strong>
            <span>MongoDB source</span>
          </div>
        </div>
        <Link className="admin-sidebar__help" href="/" onClick={() => setDrawerOpen(false)}>
          <CircleHelp aria-hidden="true" size={16} />
          <span>Back to website</span>
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="admin-app">
      <div className="admin-desktop-sidebar">{sidebar}</div>
      {drawerOpen ? (
        <div className="admin-drawer">
          <button
            aria-label="Close admin navigation"
            className="admin-drawer__scrim"
            onClick={() => setDrawerOpen(false)}
            type="button"
          />
          <div className="admin-drawer__panel" id="admin-mobile-drawer">
            <button
              aria-label="Close navigation"
              className="admin-icon-button admin-drawer__close"
              onClick={() => setDrawerOpen(false)}
              type="button"
            >
              <X aria-hidden="true" size={20} />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__title">
            <button
              aria-controls="admin-mobile-drawer"
              aria-expanded={drawerOpen}
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
              className="admin-icon-button admin-menu-button"
              onClick={() => setDrawerOpen((open) => !open)}
              type="button"
            >
              {drawerOpen ? (
                <X aria-hidden="true" size={20} />
              ) : (
                <Menu aria-hidden="true" size={20} />
              )}
            </button>
            <div>
              <p>{siteConfig.brand.name} / ADMIN</p>
              <h1>{title}</h1>
            </div>
          </div>
          <div className="admin-topbar__actions">
            <button
              aria-label="Notifications (not connected)"
              className="admin-icon-button"
              title="Notifications are not connected in this prototype"
              type="button"
            >
              <Bell aria-hidden="true" size={18} />
              <span className="admin-notification-dot" />
            </button>
            <div aria-label="Admin profile placeholder" className="admin-profile">
              <span className="admin-profile__avatar">
                {siteConfig.brand.name[0]}
              </span>
              <span className="admin-profile__text">
                <strong>Admin</strong>
                <small>Fleet manager</small>
              </span>
            </div>
            <button
              aria-label="Sign out of admin"
              className="admin-icon-button"
              onClick={() => void signOut()}
              title="Sign out"
              type="button"
            >
              <LogOut aria-hidden="true" size={17} />
            </button>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
