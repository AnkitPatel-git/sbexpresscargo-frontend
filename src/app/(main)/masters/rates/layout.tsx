import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rate Master",
};

export default function RateMasterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
