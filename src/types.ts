export interface ParkingSlot {
  id: string;
  code: string; // e.g. A-01, B-05
  zoneId: string;
  status: 'free' | 'occupied' | 'reserved';
  type: 'standard' | 'ev' | 'disabled' | 'compact';
  // Coordinates for the 2D layout map
  x: number;
  y: number;
  width: number;
  height: number;
  reservedUntil?: string;
  vehicleNumber?: string;
}

export interface ParkingZone {
  id: string;
  name: string;
  description: string;
  totalSlots: number;
  baseRatePerHour: number;
}

export interface Reservation {
  id: string;
  slotId: string;
  slotCode: string;
  zoneId: string;
  vehicleNumber: string;
  userEmail: string;
  startTime: string;
  endTime: string;
  hours: number;
  totalCost: number;
  passCode: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface PredictionData {
  time: string; // "08:00", etc.
  expectedOccupancy: number; // Percentage
  estimatedArrivals: number;
  estimatedDepartures: number;
}

export interface AIAnalysisResponse {
  recommendation: string;
  suggestedTariffRate: number; // pricing premium multiplier e.g. 1.0, 1.5, 1.8
  forecastSummary: string;
  confidenceScore: number; // percentage
  hourlyPredictions: PredictionData[];
  sustainabilityScore: number; // dynamic indicator based on efficiency
}

export interface DetectionLog {
  id: string;
  timestamp: string;
  cameraId: string;
  slotCode: string;
  previousState: 'free' | 'occupied';
  newState: 'free' | 'occupied';
  confidence: number;
  imageUrl?: string;
}
