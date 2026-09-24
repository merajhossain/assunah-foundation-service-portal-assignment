"use client";

import { useState } from "react";
import { NewRequestModal } from "./NewRequestModal";

type NewRequestButtonProps = {
  label: string;
  canAssign: boolean;
  priorityLabels: Record<string, string>;
};

export function NewRequestButton({
  label,
  canAssign,
  priorityLabels,
}: NewRequestButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        {label}
      </button>
      <NewRequestModal
        open={open}
        onClose={() => setOpen(false)}
        canAssign={canAssign}
        priorityLabels={priorityLabels}
      />
    </>
  );
}
