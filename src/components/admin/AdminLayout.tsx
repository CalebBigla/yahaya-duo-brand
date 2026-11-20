/**
 * Admin Layout - shell for the admin dashboard.
 * Collapsible sidebar, sticky header with ⌘K command palette, live notifications,
 * theme and account menus. Mounted once by the root route; nested pages that also
 * render <AdminLayout> just get their children back (see AdminAuthContext).
 */
import { useContext, useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  LayoutDashboard,
  Inbox,
  Users as UsersIcon,
  FileText,
  Wallet,
  Receipt,
  Globe,
  Settings,
  Menu,
  X,
  LogOut,
  Search,
  Sun,
  Moon,
  Monitor,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  ChevronsUpDown,
  Fuel,
  type LucideIcon,
  Images,
} from 'lucide-react';
import { signOut, type AdminUser } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { AdminAuthContext } from '@/components/admin/AdminAuthContext';
import { NotificationBell } from '@/components/admin/NotificationPanel';
import { LiveIndicator } from '@/components/admin/LiveIndicator';
import { CommandPalette, type PaletteLink } from '@/components/admin/CommandPalette';
import { NotificationsProvider, useNotifications } from '@/lib/notifications';

import { iconButtonLg } from '@/components/admin/ui';
interface AdminLayoutProps {
  children: ReactNode;
  adminUser: AdminUser | null;
}

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SIDEBAR_KEY = 'yahaya-admin-sidebar-collapsed';

export function AdminLayout({ children, adminUser }: AdminLayoutProps) {
  const sharedAdminAuth = useContext(AdminAuthContext);
  // Protected admin routes reuse the persistent shell mounted by the root route.
  if (sharedAdminAuth) return <>{children}</>;

  return (
    <NotificationsProvider enabled={!!adminUser}>
      <AdminShell adminUser={adminUser}>{children}</AdminShell>
    </NotificationsProvider>
  );
}

function AdminShell({ children, adminUser }: AdminLayoutProps) {
  const location = useLocation();
  const { newEnquiryCount, status } = useNotifications();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const isOwner = adminUser?.role === 'owner';

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === '1');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!adminUser) return;
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [adminUser]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, current ? '0' : '1');
      } catch {
        // ignore
      }
      return !current;
    });
  };

  const sections: NavSection[] = [
    {
      title: 'Overview',
      items: [{ name: 'Dashboard', path: '/admin', icon: LayoutDashboard }],
    },
    {
      title: 'Sales',
      items: [
        { name: 'Enquiries', path: '/admin/enquiries', icon: Inbox, badge: newEnquiryCount },
        { name: 'Clients', path: '/admin/clients', icon: UsersIcon },
        { name: 'Quotes', path: '/admin/quotes', icon: FileText },
      ],
    },
    {
      title: 'Money',
      items: [
        { name: 'Finance', path: '/admin/finance', icon: Wallet },
        { name: 'Expenses', path: '/admin/expenses', icon: Receipt },
        ...(isOwner ? [{ name: 'Oil Trade', path: '/admin/oil-trade', icon: Fuel }] : []),
      ],
    },
    {
      title: 'Workspace',
      items: [
        { name: 'Website', path: '/admin/website', icon: Globe },
        { name: 'Media', path: '/admin/media', icon: Images },
        ...(isOwner ? [{ name: 'Audit Log', path: '/admin/audit-log', icon: ClipboardList }] : []),
        { name: 'Settings', path: '/admin/settings', icon: Settings },
      ],
    },
  ];

  const allPages: PaletteLink[] = sections.flatMap((s) => s.items.map(({ name, path, icon }) => ({ name, path, icon })));
  const actions: PaletteLink[] = [
    { name: 'New quote', path: '/admin/quotes', icon: FileText },
    { name: 'New client', path: '/admin/clients', icon: UsersIcon },
    ...(isOwner
      ? [
          { name: 'Record income', path: '/admin/finance', icon: Wallet },
          { name: 'Record expense', path: '/admin/expenses', icon: Receipt },
        ]
      : []),
  ];

  const isActive = (path: string) =>
    path === '/admin' ? location.pathname === '/admin' || location.pathname === '/admin/' : location.pathname.startsWith(path);
  const currentPage = allPages.find((p) => p.path !== '/admin' && isActive(p.path))?.name ?? 'Dashboard';

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/admin/login';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* Desktop sidebar */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-200 motion-reduce:transition-none lg:flex dark:border-white/5 dark:bg-gray-900 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <Brand collapsed={collapsed} />
        <SidebarNav sections={sections} collapsed={collapsed} isActive={isActive} />
        <div className="border-t border-gray-100 p-3 dark:border-white/5">
          <AccountMenu
            adminUser={adminUser}
            email={email}
            collapsed={collapsed}
            onSignOut={handleSignOut}
          />
        </div>
      </aside>

      {/* Mobile drawer */}
      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-gray-950/50 backdrop-blur-sm lg:hidden" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-left lg:hidden dark:bg-gray-900"
          >
            <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
            <div className="flex items-center justify-between pr-3">
              <Brand collapsed={false} />
              <DialogPrimitive.Close className={iconButtonLg}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close navigation</span>
              </DialogPrimitive.Close>
            </div>
            <SidebarNav sections={sections} collapsed={false} isActive={isActive} />
            <div className="border-t border-gray-100 p-3 dark:border-white/5">
              <AccountMenu adminUser={adminUser} email={email} collapsed={false} onSignOut={handleSignOut} />
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 bg-white/80 px-3 backdrop-blur-md sm:px-4 dark:border-white/5 dark:bg-gray-900/80">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={`${iconButtonLg} lg:hidden`}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={`${iconButtonLg} !hidden lg:!inline-flex`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
          </button>

          <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
            <span className="text-gray-400 dark:text-gray-500">Admin</span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="truncate font-medium text-gray-900 dark:text-white">{currentPage}</span>
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 md:w-64 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:border-white/20"
              aria-label="Open command menu"
            >
              <Search className="h-4 w-4" />
              <span className="hidden flex-1 text-left md:inline">Search or jump to…</span>
              <kbd className="hidden rounded border border-gray-200 bg-white px-1.5 text-[10px] font-medium text-gray-400 md:inline dark:border-white/10 dark:bg-gray-900">
                Ctrl K
              </kbd>
            </button>
            <span className="hidden sm:inline-flex">
              <LiveIndicator status={status} />
            </span>
            <NotificationBell />
            <ThemeMenu />
          </div>
        </header>

        <main className="admin-main min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {/* Re-keyed per page so each page eases in; skipped for reduced-motion users. */}
          <div
            key={location.pathname}
            className="mx-auto w-full max-w-[1440px] p-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 sm:p-6 lg:p-8 motion-reduce:animate-none"
          >
            {children}
          </div>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        pages={allPages}
        actions={actions}
        onSignOut={() => void handleSignOut()}
      />
    </div>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link to="/admin" className="flex h-14 shrink-0 items-center gap-3 px-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-sm font-bold text-white shadow-sm ring-1 ring-inset ring-white/10">
        Y
      </span>
      {!collapsed && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">Yahaya Travel</span>
          <span className="block truncate text-xs text-gray-500 dark:text-gray-400">Admin console</span>
        </span>
      )}
    </Link>
  );
}

function SidebarNav({
  sections,
  collapsed,
  isActive,
}: {
  sections: NavSection[];
  collapsed: boolean;
  isActive: (path: string) => boolean;
}) {
  return (
    <nav aria-label="Admin" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {sections.map((section) => (
        <div key={section.title}>
          {collapsed ? (
            <div className="mx-auto mb-2 h-px w-6 bg-gray-200 first:hidden dark:bg-white/10" aria-hidden />
          ) : (
            <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {section.title}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(item.path);
              const badge = item.badge && item.badge > 0 ? (item.badge > 99 ? '99+' : String(item.badge)) : null;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? item.name : undefined}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      active
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-blue-600 dark:bg-blue-400" aria-hidden />
                    )}
                    <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? '' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}`} />
                    {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
                    {badge && !collapsed && (
                      <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white tabular-nums">
                        {badge}
                      </span>
                    )}
                    {badge && collapsed && (
                      <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-gray-900" aria-label={`${badge} new`} />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

const menuContentClass =
  'z-50 min-w-[14rem] overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-xl shadow-gray-900/10 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 dark:border-white/10 dark:bg-gray-900 dark:shadow-black/40';
const menuItemClass =
  'flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-700 outline-none data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900 dark:text-gray-300 dark:data-[highlighted]:bg-white/10 dark:data-[highlighted]:text-white';

function initialsFor(email: string | null, isOwner: boolean) {
  if (!email) return isOwner ? 'A' : 'S';
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  const letters = parts.length >= 2 ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}` : local.slice(0, 2);
  return letters.toUpperCase() || 'A';
}

function AccountMenu({
  adminUser,
  email,
  collapsed,
  onSignOut,
}: {
  adminUser: AdminUser | null;
  email: string | null;
  collapsed: boolean;
  onSignOut: () => void;
}) {
  const isOwner = adminUser?.role === 'owner';
  const roleLabel = isOwner ? 'Owner · full access' : 'Staff · operations';
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-white/5 ${
            collapsed ? 'justify-center' : ''
          }`}
          aria-label="Account menu"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-semibold text-white dark:from-slate-500 dark:to-slate-700">
            {initialsFor(email, isOwner)}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
                  {email ?? (isOwner ? 'Admin' : 'Staff')}
                </span>
                <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{roleLabel}</span>
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-400" />
            </>
          )}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content side="top" align="start" sideOffset={8} className={menuContentClass}>
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{email ?? 'Signed in'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabel}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-gray-100 dark:bg-white/5" />
          <DropdownMenu.Item asChild className={menuItemClass}>
            <Link to="/admin/settings">
              <Settings className="h-4 w-4 text-gray-400" />
              Settings
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={onSignOut}
            className={`${menuItemClass} text-rose-600 data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700 dark:text-rose-400 dark:data-[highlighted]:bg-rose-500/10 dark:data-[highlighted]:text-rose-300`}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;
  const Current = options.find((o) => o.value === theme)?.icon ?? Monitor;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={iconButtonLg}
          aria-label="Change theme"
        >
          <Current className="h-[18px] w-[18px]" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className={`${menuContentClass} min-w-[10rem]`}>
          {options.map(({ value, label, icon: Icon }) => (
            <DropdownMenu.Item key={value} onSelect={() => setTheme(value)} className={menuItemClass}>
              <Icon className="h-4 w-4 text-gray-400" />
              <span className="flex-1">{label}</span>
              {theme === value && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
