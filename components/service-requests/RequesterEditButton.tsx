"use client";

import { useState } from "react";
import { NewRequestModal } from "./NewRequestModal";

type RequesterEditButtonProps = {
  publicId: string;
  label: string;
  priorityLabels: Record<string, string>;
  disabled?: boolean;
  disabledTooltip?: string;
};

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function RequesterEditButton({
  publicId,
  label,
  priorityLabels,
  disabled = false,
  disabledTooltip,
}: RequesterEditButtonProps) {
  const [open, setOpen] = useState(false);

  if (disabled) {
    return (
      <span title={disabledTooltip} className="inline-flex">
        <button
          type="button"
          disabled
          aria-label={disabledTooltip ?? label}
          className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-300"
        >
          <PencilIcon />
        </button>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        title={label}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-ink hover:border-brand hover:bg-gray-50 hover:text-brand"
      >
        <PencilIcon />
      </button>
      <NewRequestModal
        open={open}
        onClose={() => setOpen(false)}
        canAssign={false}
        priorityLabels={priorityLabels}
        editPublicId={publicId}
      />
    </>
  );
}
