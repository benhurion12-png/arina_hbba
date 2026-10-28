"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";

export function useSession(options: { admin?: boolean } = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiFetch<{ user: User }>("/auth/me")
      .then(({ user: currentUser }) => {
        if (options.admin && currentUser.role !== "ADMIN") {
          router.replace("/dashboard");
          return;
        }
        setUser(currentUser);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [options.admin, router]);

  return { user, loading };
}
