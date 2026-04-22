import type { PincodeDistanceResponse } from "@/types/utilities/pincode-distance"

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const errorData = await response.json()
    return errorData.message || fallback
  } catch {
    return fallback
  }
}

export const pincodeDistanceService = {
  async getPincodeDistance(fromPinCode: string, toPinCode: string): Promise<PincodeDistanceResponse> {
    const queryParams = new URLSearchParams({
      fromPinCode,
      toPinCode,
    })

    const response = await fetch(`/internal/pincode-distance?${queryParams.toString()}`)

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to calculate pincode distance"))
    }

    return response.json()
  },
}
