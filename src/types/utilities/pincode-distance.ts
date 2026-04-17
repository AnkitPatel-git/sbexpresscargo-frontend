export interface PincodeDistanceData {
  fromPinCode: string;
  toPinCode: string;
  distanceKm: number;
  source: "osrm" | "haversine";
}

export interface PincodeDistanceResponse {
  success: boolean;
  message?: string;
  data?: PincodeDistanceData;
}
