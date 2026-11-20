import { Link } from "@tanstack/react-router";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Logo } from "./Logo";
import { ButtonLink } from "./Button";
import { brand } from "@/lib/brand";

/**
 * Full-screen mobile navigation. Loaded only when the menu is first opened, so the
 * dialog code is not part of every page. Radix provides the focus trap, Escape,
 * scroll lock, and returns focus to the menu button on close.
 */
export default function MobileMenu({
  open,
  onOpenChange,
  links,
  telHref,
  phone,
  returnFocusTo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links: Array<{ to: string; label: string }>;
  telHref: string;
  phone: string;
  /** The menu button: focus goes back to it when the menu closes. */
  returnFocusTo?: HTMLElement | null;
}) {
  const close = () => onOpenChange(false);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusTo?.focus();
          }}
          className="fixed inset-0 z-50 flex flex-col bg-background outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-200 lg:hidden"
        >
          <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
          <div className="container-page flex h-[4.5rem] items-center justify-between">
            <Logo />
            <DialogPrimitive.Close className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-primary" aria-label="Close menu">
              <X className="h-6 w-6" strokeWidth={1.5} />
            </DialogPrimitive.Close>
          </div>
          <nav aria-label="Main" className="container-page flex flex-1 flex-col pb-10 pt-6">
            <ul className="divide-y divide-border border-y border-border">
              {links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} onClick={close} className="flex min-h-16 items-center font-display text-2xl text-primary" activeProps={{ "aria-current": "page" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto space-y-4 pt-10">
              <ButtonLink to="/quote" className="w-full" onClick={close}>
                {brand.advisorAction}
              </ButtonLink>
              <p className="t-small text-center text-muted-foreground">
                Or call{" "}
                <a href={telHref} className="font-semibold text-primary underline underline-offset-4">
                  {phone}
                </a>
              </p>
            </div>
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
