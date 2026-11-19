import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Command } from 'cmdk';
import { Search, Sun, Moon, Monitor, LogOut, Plus, type LucideIcon } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export interface PaletteLink {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: PaletteLink[];
  actions: PaletteLink[];
  onSignOut: () => void;
}

const itemClass =
  'flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none data-[selected=true]:bg-gray-100 data-[selected=true]:text-gray-900 dark:text-gray-300 dark:data-[selected=true]:bg-white/10 dark:data-[selected=true]:text-white';
const groupClass =
  'px-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-gray-400';

/** ⌘K / Ctrl+K palette for jumping between admin pages and common actions. */
export function CommandPalette({ open, onOpenChange, pages, actions, onSignOut }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-gray-950/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-50 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 dark:border-white/10 dark:bg-gray-900"
        >
          <DialogPrimitive.Title className="sr-only">Command menu</DialogPrimitive.Title>
          <Command loop className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-gray-100 px-4 dark:border-white/5">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <Command.Input
                autoFocus
                placeholder="Go to a page or run an action…"
                className="h-12 w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
              />
              <kbd className="hidden rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 sm:block dark:border-white/10">
                Esc
              </kbd>
            </div>
            <Command.List className="max-h-[min(24rem,60vh)] overflow-y-auto pb-2">
              <Command.Empty className="px-4 py-10 text-center text-sm text-gray-500">No matches.</Command.Empty>

              <Command.Group heading="Go to" className={groupClass}>
                {pages.map((page) => (
                  <Command.Item
                    key={page.path}
                    value={`go ${page.name}`}
                    onSelect={() => run(() => void navigate({ to: page.path }))}
                    className={itemClass}
                  >
                    <page.icon className="h-4 w-4 text-gray-400" />
                    {page.name}
                  </Command.Item>
                ))}
              </Command.Group>

              {actions.length > 0 && (
                <Command.Group heading="Create" className={groupClass}>
                  {actions.map((action) => (
                    <Command.Item
                      key={action.name}
                      value={`create ${action.name}`}
                      onSelect={() => run(() => void navigate({ to: action.path }))}
                      className={itemClass}
                    >
                      <Plus className="h-4 w-4 text-gray-400" />
                      {action.name}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              <Command.Group heading="Appearance" className={groupClass}>
                {([
                  ['light', 'Light theme', Sun],
                  ['dark', 'Dark theme', Moon],
                  ['system', 'Match system theme', Monitor],
                ] as const).map(([value, label, Icon]) => (
                  <Command.Item key={value} value={label} onSelect={() => run(() => setTheme(value))} className={itemClass}>
                    <Icon className="h-4 w-4 text-gray-400" />
                    {label}
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Account" className={groupClass}>
                <Command.Item value="sign out log out" onSelect={() => run(onSignOut)} className={itemClass}>
                  <LogOut className="h-4 w-4 text-gray-400" />
                  Sign out
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
