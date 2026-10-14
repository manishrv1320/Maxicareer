import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, ChevronDown, ExternalLink, LogOut, Menu, PanelLeft, Search, X } from 'lucide-react';
import { BrandLogo } from '../BrandLogo';
import { Avatar, cx } from '../admin/ui';
import { usePersistentState, timeAgo } from '../admin/lib';

/**
 * The vertical-sidebar layout shared by the student portal and the counsellor/mentor
 * workspace. It mirrors the admin portal: a collapsible navy sidebar with grouped pages,
 * a top bar with a page finder, notifications and the account menu.
 */

export type ShellIcon = React.ComponentType<{ className?: string }>;

export interface ShellNavItem<T extends string> {
  id: T;
  label: string;
  icon: ShellIcon;
  /** Number shown next to the label. Alerts are highlighted. */
  badge?: number;
  alert?: boolean;
}

export interface ShellNavGroup<T extends string> {
  label: string;
  items: ShellNavItem<T>[];
}

export interface ShellNotification {
  id: string;
  title: string;
  body?: string;
  createdAt: string;
  read: boolean;
}

interface WorkspaceShellProps<T extends string> {
  /** "Student portal", "Mentor workspace"… shown under the logo. */
  portalLabel: string;
  groups: ShellNavGroup<T>[];
  active: T;
  onNavigate: (id: T) => void;
  user: { name: string; email: string; subtitle?: string; avatarUrl?: string };
  notifications?: ShellNotification[];
  onOpenNotification?: (n: ShellNotification) => void;
  onMarkAllRead?: () => void;
  onViewAllNotifications?: () => void;
  onSignOut: () => void;
  onBackToSite?: () => void;
  /** localStorage key for the collapsed sidebar. */
  storageKey: string;
  /** Extra controls in the top bar (left of the bell). */
  topBarExtra?: React.ReactNode;
  /** A strip above the page content (e.g. "sample data" or a renewal warning). */
  banner?: React.ReactNode;
  children: React.ReactNode;
}

export function WorkspaceShell<T extends string>({
  portalLabel,
  groups,
  active,
  onNavigate,
  user,
  notifications = [],
  onOpenNotification,
  onMarkAllRead,
  onViewAllNotifications,
  onSignOut,
  onBackToSite,
  storageKey,
  topBarExtra,
  banner,
  children,
}: WorkspaceShellProps<T>) {
  const [collapsed, setCollapsed] = usePersistentState<boolean>(storageKey, false);
  const [mobileNav, setMobileNav] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [jump, setJump] = useState('');
  const [jumpOpen, setJumpOpen] = useState(false);

  const allItems = useMemo(() => groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))), [groups]);
  const current = allItems.find((i) => i.id === active);
  const unread = notifications.filter((n) => !n.read).length;
  const latest = [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const jumpResults = allItems.filter((i) => !jump.trim() || `${i.label} ${i.group}`.toLowerCase().includes(jump.trim().toLowerCase())).slice(0, 8);

  const go = (id: T) => {
    onNavigate(id);
    setMobileNav(false);
    setBellOpen(false);
    setUserMenu(false);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('ws-jump')?.focus();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const badge = (it: ShellNavItem<T>, isActive: boolean) => {
    if (!it.badge) return null;
    return it.alert ? (
      <span className="mc-num rounded-full bg-[#F2A93B] text-[#0D1B3E] text-[11px] font-semibold px-1.5 min-w-[20px] text-center">{it.badge > 99 ? '99+' : it.badge}</span>
    ) : (
      <span className={cx('mc-num text-[11.5px]', isActive ? 'text-[#C3D0EA]' : 'text-[#8FA3CC]')}>{it.badge}</span>
    );
  };

  const sidebar = (isMobile: boolean) => {
    const narrow = collapsed && !isMobile;
    return (
      <div className="flex h-full flex-col">
        <div className={cx('h-16 flex items-center shrink-0 border-b border-white/[0.07]', narrow ? 'justify-center px-2' : 'justify-between px-5')}>
          {!narrow && (
            <button type="button" onClick={() => go(groups[0]?.items[0]?.id as T)} className="text-left min-w-0" aria-label="Dashboard">
              <BrandLogo variant="dark" className="h-7 w-auto" />
              <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7C8FB8] mt-0.5 truncate">{portalLabel}</span>
            </button>
          )}
          {isMobile ? (
            <button type="button" onClick={() => setMobileNav(false)} className="p-2 rounded-[8px] text-[#AFC0E3] hover:bg-white/10" aria-label="Close menu">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-[8px] text-[#8FA3CC] hover:text-white hover:bg-white/10"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 mc-scroll-dark" aria-label={portalLabel}>
          {groups.map((g) => (
            <div key={g.label}>
              {!narrow ? <div className="px-3 mb-1.5 text-[12px] font-medium text-[#7C8FB8]">{g.label}</div> : <div className="mx-3 mb-2 h-px bg-white/[0.08]" />}
              <ul className="space-y-0.5">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const isActive = active === it.id;
                  return (
                    <li key={it.id}>
                      <button
                        type="button"
                        onClick={() => go(it.id)}
                        title={narrow ? it.label : undefined}
                        aria-current={isActive ? 'page' : undefined}
                        className={cx(
                          'relative w-full flex items-center gap-3 rounded-[9px] text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]',
                          narrow ? 'justify-center h-10' : 'h-9 px-3',
                          isActive ? 'bg-white/[0.09] text-white font-semibold' : 'text-[#C3D0EA] hover:text-white hover:bg-white/[0.05] font-medium'
                        )}
                      >
                        {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[#38BDF8]" aria-hidden />}
                        <Icon className={cx('w-[17px] h-[17px] shrink-0', isActive ? 'text-[#38BDF8]' : 'text-[#8FA3CC]')} />
                        {!narrow && <span className="flex-1 text-left truncate">{it.label}</span>}
                        {!narrow && badge(it, isActive)}
                        {narrow && it.alert && !!it.badge && <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-[#F2A93B]" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="shrink-0 border-t border-white/[0.07] p-3 space-y-0.5">
          {onBackToSite && (
            <button
              type="button"
              onClick={onBackToSite}
              title={narrow ? 'View website' : undefined}
              className={cx('w-full flex items-center gap-3 rounded-[9px] text-[13.5px] font-medium text-[#C3D0EA] hover:text-white hover:bg-white/[0.05]', narrow ? 'justify-center h-10' : 'h-9 px-3')}
            >
              <ExternalLink className="w-[17px] h-[17px] text-[#8FA3CC]" />
              {!narrow && 'View website'}
            </button>
          )}
          <button
            type="button"
            onClick={onSignOut}
            title={narrow ? 'Sign out' : undefined}
            className={cx('w-full flex items-center gap-3 rounded-[9px] text-[13.5px] font-medium text-[#C3D0EA] hover:text-white hover:bg-white/[0.05]', narrow ? 'justify-center h-10' : 'h-9 px-3')}
          >
            <LogOut className="w-[17px] h-[17px] text-[#8FA3CC]" />
            {!narrow && 'Sign out'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mc-admin min-h-screen bg-[#F3F6FB] text-[#0D1B3E] flex">
      {/* Desktop sidebar */}
      <aside className={cx('hidden lg:block shrink-0 bg-[#0D1B3E] sticky top-0 h-screen transition-[width] duration-200 z-30', collapsed ? 'w-[72px]' : 'w-[248px]')}>{sidebar(false)}</aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileNav && (
          <div className="lg:hidden fixed inset-0 z-[60]">
            <motion.div className="absolute inset-0 bg-[#0D1B3E]/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNav(false)} />
            <motion.aside
              className="absolute left-0 top-0 h-full w-[272px] bg-[#0D1B3E]"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.2 }}
            >
              {sidebar(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-16 bg-[#F3F6FB]/90 backdrop-blur-md border-b border-[#DDE4EF] flex items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => setMobileNav(true)} className="lg:hidden p-2 -ml-2 rounded-[8px] text-[#26355A] hover:bg-[#E9EEF5]" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex items-center gap-2 text-[13.5px] min-w-0">
            <span className="text-[#7A869E]">{current?.group || portalLabel}</span>
            <span className="text-[#B7C3D7]">/</span>
            <span className="font-semibold text-[#0D1B3E] truncate">{current?.label}</span>
          </div>

          {/* Page finder */}
          <div className="relative ml-auto w-full max-w-[280px] hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C97AE]" />
            <input
              id="ws-jump"
              value={jump}
              onChange={(e) => setJump(e.target.value)}
              onFocus={() => setJumpOpen(true)}
              onBlur={() => setTimeout(() => setJumpOpen(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && jumpResults[0]) {
                  go(jumpResults[0].id);
                  setJump('');
                  (e.target as HTMLInputElement).blur();
                }
              }}
              placeholder="Jump to a page"
              className="w-full h-9 rounded-[10px] border border-[#D3DBE8] bg-white pl-9 pr-12 text-[13.5px] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
              aria-label="Jump to a page"
            />
            <kbd className="hidden lg:block absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#8C97AE] border border-[#DDE4EF] rounded px-1.5">Ctrl K</kbd>
            {jumpOpen && (
              <div className="absolute left-0 right-0 mt-2 rounded-[14px] border border-[#DDE4EF] bg-white shadow-[0_12px_32px_-12px_rgba(13,27,62,0.25)] py-2 z-50">
                {jumpResults.length === 0 && <div className="px-3 py-3 text-[13px] text-[#5B6885]">No pages match "{jump}"</div>}
                {jumpResults.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={() => {
                        go(p.id);
                        setJump('');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13.5px] hover:bg-[#F3F6FB]"
                    >
                      <Icon className="w-4 h-4 text-[#7A869E]" /> {p.label}
                      <span className="ml-auto text-[12px] text-[#8C97AE]">{p.group}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className={cx('flex items-center gap-1.5', 'ml-auto md:ml-0')}>
            {topBarExtra}

            {/* Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setBellOpen(!bellOpen);
                  setUserMenu(false);
                }}
                className="relative h-9 w-9 flex items-center justify-center rounded-[10px] text-[#26355A] hover:bg-[#E9EEF5]"
                aria-label={`Notifications, ${unread} unread`}
              >
                <Bell className="w-[18px] h-[18px]" />
                {unread > 0 && (
                  <span className="mc-num absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F2A93B] text-[#0D1B3E] text-[10.5px] font-bold flex items-center justify-center ring-2 ring-[#F3F6FB]">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              {bellOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                  <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-[16px] border border-[#DDE4EF] bg-white shadow-[0_16px_40px_-16px_rgba(13,27,62,0.3)] z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAEFF6]">
                      <span className="mc-display text-[15px] font-semibold">Notifications</span>
                      {unread > 0 && onMarkAllRead && (
                        <button type="button" className="text-[12.5px] font-semibold text-[#2563EB] inline-flex items-center gap-1" onClick={onMarkAllRead}>
                          <Check className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      )}
                    </div>
                    <ul className="max-h-[360px] overflow-y-auto divide-y divide-[#EAEFF6]">
                      {latest.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-[#5B6885]">Nothing new.</li>}
                      {latest.map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setBellOpen(false);
                              onOpenNotification?.(n);
                            }}
                            className={cx('w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#F7F9FC]', !n.read && 'bg-[#FFFBF3]')}
                          >
                            <span className="h-8 w-8 shrink-0 rounded-[9px] flex items-center justify-center bg-[#E8F0FE] text-[#1D4FD7]">
                              <Bell className="w-4 h-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={cx('block text-[13.5px] truncate', n.read ? 'font-medium' : 'font-semibold')}>{n.title}</span>
                              {n.body && <span className="block text-[12.5px] text-[#5B6885] line-clamp-2">{n.body}</span>}
                              <span className="block text-[12px] text-[#7A869E]">{timeAgo(n.createdAt)}</span>
                            </span>
                            {!n.read && <span className="mt-2 h-2 w-2 rounded-full bg-[#F2A93B] shrink-0" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                    {onViewAllNotifications && (
                      <button
                        type="button"
                        onClick={() => {
                          setBellOpen(false);
                          onViewAllNotifications();
                        }}
                        className="w-full px-4 py-3 text-[13px] font-semibold text-[#2563EB] border-t border-[#EAEFF6] hover:bg-[#F7F9FC]"
                      >
                        Open notifications
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Account */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserMenu(!userMenu);
                  setBellOpen(false);
                }}
                className="flex items-center gap-2 rounded-[10px] p-1 pr-2 hover:bg-[#E9EEF5]"
                aria-label="Account menu"
              >
                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-[30px] w-[30px] rounded-[10px] object-cover" /> : <Avatar name={user.name} size={30} tone="blue" />}
                <span className="hidden md:block text-left max-w-[160px]">
                  <span className="block text-[13px] font-semibold leading-tight truncate">{user.name}</span>
                  {user.subtitle && <span className="block text-[11.5px] text-[#7A869E] leading-tight truncate">{user.subtitle}</span>}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8C97AE]" />
              </button>
              {userMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-60 rounded-[14px] border border-[#DDE4EF] bg-white shadow-[0_16px_40px_-16px_rgba(13,27,62,0.3)] p-1.5 z-50">
                    <div className="px-3 py-2.5 border-b border-[#EAEFF6] mb-1">
                      <div className="text-[13.5px] font-semibold truncate">{user.name}</div>
                      <div className="text-[12px] text-[#7A869E] truncate">{user.email}</div>
                    </div>
                    {onBackToSite && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenu(false);
                          onBackToSite();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-[13.5px] hover:bg-[#F3F6FB]"
                      >
                        <ExternalLink className="w-4 h-4 text-[#7A869E]" /> View website
                      </button>
                    )}
                    <button type="button" onClick={onSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-[13.5px] text-[#B42F3B] hover:bg-[#FCEBEC]">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mc-canvas flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-[1320px] mx-auto">
            {banner && <div className="mb-5">{banner}</div>}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
