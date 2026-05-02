import { Suspense } from "react";

export default function RatesSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg border border-border/80 bg-card p-8 text-center text-sm text-muted-foreground">
          Loading rates…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
