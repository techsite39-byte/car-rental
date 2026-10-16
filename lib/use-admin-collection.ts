"use client";

import { useEffect, useState } from "react";
import type { Repository } from "@/lib/admin-data";

export function useAdminCollection<T extends { id: string }>(
  repository: Repository<T>,
  seed: T[],
) {
  const [items, setItems] = useState<T[]>(seed);
  const [error, setError] = useState("");

  useEffect(() => {
    const refresh = () => {
      try {
        setItems(repository.list());
        setError("");
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to read saved browser data.",
        );
      }
    };

    refresh();
    window.addEventListener("epicdrive-admin-data", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("epicdrive-admin-data", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [repository]);

  return { items, error };
}
