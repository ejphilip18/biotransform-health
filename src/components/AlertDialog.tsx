"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel = "Cancel",
  actionLabel,
  onAction,
  danger = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  cancelLabel?: string;
  actionLabel: string;
  onAction: () => void | Promise<void>;
  danger?: boolean;
}) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          className="fixed inset-0 bg-black/60"
          style={{ zIndex: 100 }}
        />
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[100] w-full max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-7",
            "bg-[var(--bg-secondary)] border-[var(--border-medium)]"
          )}
        >
          <AlertDialogPrimitive.Title className="text-base font-bold text-[var(--text-primary)]">
            {title}
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description asChild>
            <div className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
              {description}
            </div>
          </AlertDialogPrimitive.Description>
          <div className="mt-6 flex gap-3 justify-end">
            <AlertDialogPrimitive.Cancel
              className={cn(
                "rounded-lg border px-6 py-2.5 text-sm font-medium",
                "border-[var(--border-medium)] bg-transparent text-[var(--text-secondary)]",
                "hover:bg-[var(--bg-tertiary)] transition-colors"
              )}
            >
              {cancelLabel}
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              onClick={onAction}
              className={cn(
                "rounded-lg px-6 py-2.5 text-sm font-semibold transition-opacity",
                danger
                  ? "bg-[var(--status-critical)] text-white hover:opacity-90"
                  : "bg-[var(--accent-teal)] text-[var(--bg-primary)] hover:opacity-90"
              )}
            >
              {actionLabel}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
