"use client";

import { useEffect, useState } from "react";
import { createAbortableRequest, type AbortableRequest } from "./client";

/** Keeps one AbortController per component and cancels on unmount. */
export function useAbortableRequest(): AbortableRequest {
  const [abortable] = useState(createAbortableRequest);

  useEffect(() => () => abortable.abort(), [abortable]);

  return abortable;
}
