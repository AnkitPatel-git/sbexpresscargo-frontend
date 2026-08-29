"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { PermissionGuard } from "@/components/auth/permission-guard"
import { Button } from "@/components/ui/button"
import { bulkUploadLogService } from "@/services/utilities/bulk-upload-log-service"

export function BulkUploadOriginalFileButton({
  logId,
  className,
}: {
  logId: number
  className?: string
}) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      const { blob, filename } = await bulkUploadLogService.downloadOriginalFile(logId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Uploaded Excel downloaded")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download uploaded Excel")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <PermissionGuard permission="utility.bulk_upload_log.read">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className ?? "mt-3 gap-2"}
        disabled={downloading}
        onClick={() => void handleDownload()}
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Download uploaded Excel
      </Button>
    </PermissionGuard>
  )
}
