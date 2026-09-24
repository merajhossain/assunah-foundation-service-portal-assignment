"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type DbConnectionToastProps = {
  error: string | null;
};

export function DbConnectionToast({ error }: DbConnectionToastProps) {
  useEffect(() => {
    if (!error) {
      toast.dismiss("db-connection-error");
      return;
    }

    // Small delay so Toaster is mounted before showing
    const timer = setTimeout(() => {
      toast.error("Database connection failed", {
        id: "db-connection-error",
        description: error,
        duration: Infinity,
        position: "top-center",
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [error]);

  return null;
}
