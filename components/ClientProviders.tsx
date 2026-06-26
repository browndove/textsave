"use client";

import type { ReactNode } from "react";
import { ConfirmProvider } from "@/components/ConfirmProvider";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return <ConfirmProvider>{children}</ConfirmProvider>;
}
