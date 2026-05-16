"use client";

import { Shield } from "lucide-react";

import { AccessRightsPanel } from "@/components/utilities/access-rights-panel";

export default function AccessRightsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Shield className="h-5 w-5" />
          Access rights
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Assign permissions to a role. Changes apply immediately for users with that role on their
          next request. Super Admin can manage all permissions.
        </p>
      </header>

      <AccessRightsPanel />
    </div>
  );
}
