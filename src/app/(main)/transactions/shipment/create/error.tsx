"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

type ShipmentCreateErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ShipmentCreateError({ error, reset }: ShipmentCreateErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error("Shipment create page crashed:", error)
  }, [error])

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <h2 className="text-base font-semibold tracking-tight">Could not load shipment booking form</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        The page hit an unexpected runtime error. Please retry. If this persists, contact support with the time and action.
      </p>
      <div className="mt-3 flex gap-2">
        <Button type="button" onClick={reset}>
          Retry
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/transactions/shipment")}>
          Back to Shipment List
        </Button>
      </div>
    </div>
  )
}
