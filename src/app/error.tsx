"use client";

import { AccountLoadError } from "@/components/account-load-error";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <AccountLoadError retry={retry} />;
}
