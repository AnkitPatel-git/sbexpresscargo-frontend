"use client";

import { useEffect, useState } from "react";
import { bearerHeaders } from "@/lib/api-base";
import { apiFetch } from "@/lib/api-fetch";
import { hrmsService } from "@/services/hrms/hrms-service";

export function EmployeeDocumentImage({
  filePath,
  fileName,
  own = false,
}: {
  filePath?: string | null;
  fileName?: string | null;
  own?: boolean;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const stored =
    filePath?.startsWith("hrms-employee-documents/") ||
    filePath?.startsWith("hrms-employee-photos/");

  useEffect(() => {
    if (!stored || !filePath) return;
    let objectUrl = "";
    let cancelled = false;
    setFailed(false);
    setSrc(null);
    apiFetch(hrmsService.employeeDocumentUrl(filePath, own), {
      headers: bearerHeaders(false),
    })
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (cancelled) return;
        if (!blob) {
          setFailed(true);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [filePath, own, stored]);

  if (!filePath) return null;
  if (!stored) {
    return <p className="text-xs text-muted-foreground">{fileName || filePath}</p>;
  }
  if (failed) {
    return <p className="text-xs text-muted-foreground">{fileName || "Image unavailable"}</p>;
  }
  if (!src) {
    return <p className="text-xs text-muted-foreground">Loading image...</p>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={fileName || "Employee document"}
      className="h-24 w-auto max-w-full rounded border object-contain"
    />
  );
}
