"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--text-secondary)",
  marginBottom: "6px",
  display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  marginBottom: "16px",
};

export function DeleteAccountDialog({
  open,
  onOpenChange,
  confirmation,
  onConfirmationChange,
  deleting,
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmation: string;
  onConfirmationChange: (v: string) => void;
  deleting: boolean;
  error: string | null;
  onConfirm: () => void | Promise<void>;
}) {
  const canConfirm = confirmation === "DELETE" && !deleting;

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          className="fixed inset-0 bg-black/60"
          style={{ zIndex: 100 }}
        />
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[100] w-full max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-7",
            "bg-[var(--bg-secondary)] border-[rgba(239,68,68,0.3)]"
          )}
        >
          <AlertDialogPrimitive.Title className="text-base font-bold text-[var(--status-critical)]">
            Delete Your Account
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description asChild>
            <div className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
              <p className="mb-2">This will permanently delete all your health data, including:</p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>Profile information</li>
                <li>Uploaded lab reports</li>
                <li>Biomarker results and history</li>
                <li>Health plans and recommendations</li>
                <li>Daily check-in data</li>
              </ul>
              <p className="mb-4 text-[var(--text-tertiary)]">
                Consent records will be retained for legal compliance. This action cannot be undone.
              </p>
              <label style={labelStyle}>
                Type <span className="font-bold text-[var(--status-critical)]">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmation}
                onChange={(e) => onConfirmationChange(e.target.value)}
                placeholder="DELETE"
                style={inputStyle}
                autoComplete="off"
              />
              {error && (
                <p className="text-sm text-[var(--status-critical)] mb-4">{error}</p>
              )}
            </div>
          </AlertDialogPrimitive.Description>
          <div className="flex gap-3 justify-end mt-4">
            <AlertDialogPrimitive.Cancel
              disabled={deleting}
              className={cn(
                "rounded-lg border px-6 py-2.5 text-sm font-medium",
                "border-[var(--border-medium)] bg-transparent text-[var(--text-secondary)]",
                "hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
              )}
            >
              Cancel
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <button
                onClick={onConfirm}
                disabled={!canConfirm}
                className={cn(
                  "rounded-lg px-6 py-2.5 text-sm font-semibold",
                  "bg-[var(--status-critical)] text-white",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "hover:opacity-90 transition-opacity"
                )}
              >
                {deleting ? "Deleting…" : "Permanently Delete"}
              </button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
