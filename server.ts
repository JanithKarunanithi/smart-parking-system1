import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { ParkingSlot, ParkingZone, Reservation, AIAnalysisResponse } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database State
const zones: ParkingZone[] = [
  { id: "zone-a", name: "Premium Zone A (Ground EV/Disabled)", description: "Closest to elevator, underground shelter, equipped with EV charging stations.", totalSlots: 8, baseRatePerHour: 120 },
  { id: "zone-b", name: "Standard Zone B (Open Air)", description: "Outdoor level, quick entry/exit lanes, ideal for short-stay commuters.", totalSlots: 12, baseRatePerHour: 60 },
  { id: "zone-c", name: "Economy Zone C (Rooftop Solar)", description: "Top deck lot, beautiful solar canopy protection, perfect for daily parkers.", totalSlots: 12, baseRatePerHour: 40 }
];

// Initialize Parking Slots with exact coordinates for 2D visualization
let slots: ParkingSlot[] = [
  // Zone A slots (y=10)
  { id: "slot-a1", code: "A-01", zoneId: "zone-a", status: "free", type: "standard", x: 8, y: 12, width: 9, height: 16 },
  { id: "slot-a2", code: "A-02", zoneId: "zone-a", status: "occupied", type: "standard", x: 19, y: 12, width: 9, height: 16, vehicleNumber: "TS-09-EA-3120" },
  { id: "slot-a3", code: "A-03", zoneId: "zone-a", status: "free", type: "ev", x: 30, y: 12, width: 9, height: 16 },
  { id: "slot-a4", code: "A-04", zoneId: "zone-a", status: "reserved", type: "ev", x: 41, y: 12, width: 9, height: 16, reservedUntil: new Date(Date.now() + 7200000).toISOString(), vehicleNumber: "KA-51-MM-8841" },
  { id: "slot-a5", code: "A-05", zoneId: "zone-a", status: "free", type: "standard", x: 52, y: 12, width: 9, height: 16 },
  { id: "slot-a6", code: "A-06", zoneId: "zone-a", status: "occupied", type: "standard", x: 63, y: 12, width: 9, height: 16, vehicleNumber: "MH-12-PQ-9049" },
  { id: "slot-a7", code: "A-07", zoneId: "zone-a", status: "free", type: "disabled", x: 74, y: 12, width: 9, height: 16 },
  { id: "slot-a8", code: "A-08", zoneId: "zone-a", status: "free", type: "disabled", x: 85, y: 12, width: 9, height: 16 },

  // Zone B slots (Facing rows, top row y=38, bottom row y=58)
  { id: "slot-b1", code: "B-01", zoneId: "zone-b", status: "free", type: "standard", x: 8, y: 38, width: 9, height: 14 },
  { id: "slot-b2", code: "B-02", zoneId: "zone-b", status: "occupied", type: "standard", x: 23, y: 38, width: 9, height: 14, vehicleNumber: "DL-3C-ZZ-0012" },
  { id: "slot-b3", code: "B-03", zoneId: "zone-b", status: "free", type: "standard", x: 38, y: 38, width: 9, height: 14 },
  { id: "slot-b4", code: "B-04", zoneId: "zone-b", status: "free", type: "compact", x: 53, y: 38, width: 9, height: 14 },
  { id: "slot-b5", code: "B-05", zoneId: "zone-b", status: "occupied", type: "compact", x: 68, y: 38, width: 9, height: 14, vehicleNumber: "KA-03-EF-4567" },
  { id: "slot-b6", code: "B-06", zoneId: "zone-b", status: "free", type: "standard", x: 83, y: 38, width: 9, height: 14 },
  
  { id: "slot-b7", code: "B-07", zoneId: "zone-b", status: "free", type: "standard", x: 8, y: 58, width: 9, height: 14 },
  { id: "slot-b8", code: "B-08", zoneId: "zone-b", status: "free", type: "standard", x: 23, y: 58, width: 9, height: 14 },
  { id: "slot-b9", code: "B-09", zoneId: "zone-b", status: "occupied", type: "standard", x: 38, y: 58, width: 9, height: 14, vehicleNumber: "UP-16-AM-7722" },
  { id: "slot-b10", code: "B-10", zoneId: "zone-b", status: "free", type: "compact", x: 53, y: 58, width: 9, height: 14 },
  { id: "slot-b11", code: "B-11", zoneId: "zone-b", status: "free", type: "compact", x: 68, y: 58, width: 9, height: 14 },
  { id: "slot-b12", code: "B-12", zoneId: "zone-b", status: "free", type: "standard", x: 83, y: 58, width: 9, height: 14 },

  // Zone C slots (y=80)
  { id: "slot-c1", code: "C-01", zoneId: "zone-c", status: "free", type: "standard", x: 8, y: 80, width: 9, height: 14 },
  { id: "slot-c2", code: "C-02", zoneId: "zone-c", status: "free", type: "standard", x: 19, y: 80, width: 9, height: 14 },
  { id: "slot-c3", code: "C-03", zoneId: "zone-c", status: "occupied", type: "standard", x: 30, y: 80, width: 9, height: 14, vehicleNumber: "AP-28-CK-4401" },
  { id: "slot-c4", code: "C-04", zoneId: "zone-c", status: "occupied", type: "standard", x: 41, y: 80, width: 9, height: 14, vehicleNumber: "HR-26-Y-9988" },
  { id: "slot-c5", code: "C-05", zoneId: "zone-c", status: "free", type: "standard", x: 52, y: 80, width: 9, height: 14 },
  { id: "slot-c6", code: "C-06", zoneId: "zone-c", status: "free", type: "standard", x: 63, y: 80, width: 9, height: 14 },
  { id: "slot-c7", code: "C-07", zoneId: "zone-c", status: "free", type: "standard", x: 74, y: 80, width: 9, height: 14 },
  { id: "slot-c8", code: "C-08", zoneId: "zone-c", status: "free", type: "standard", x: 85, y: 80, width: 9, height: 14 }
];

let reservations: Reservation[] = [
  {
    id: "res-example-1",
    slotId: "slot-a4",
    slotCode: "A-04",
    zoneId: "zone-a",
    vehicleNumber: "KA-51-MM-8841",
    userEmail: "commuter@example.com",
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 7200000).toISOString(),
    hours: 2,
    totalCost: 240,
    passCode: "PK-9281",
    status: "active"
  }
];

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// Active Zones List
app.get("/api/parking/zones", (req, res) => {
  res.json(zones);
});

// Live Slots Status
app.get("/api/parking/slots", (req, res) => {
  res.json(slots);
});

// Post Reservation Booking
app.post("/api/parking/reserve", (req, res) => {
  const { slotId, vehicleNumber, userEmail, hours } = req.body;

  if (!slotId || !vehicleNumber || !userEmail || !hours) {
    return res.status(400).json({ error: "Missing required booking details." });
  }

  const slot = slots.find(s => s.id === slotId);
  if (!slot) {
    return res.status(404).json({ error: "Selected parking slot not found." });
  }

  if (slot.status !== "free") {
    return res.status(400).json({ error: "Slot is already occupied or reserved." });
  }

  const zone = zones.find(z => z.id === slot.zoneId);
  const baseRate = zone ? zone.baseRatePerHour : 3.00;
  const totalCost = baseRate * hours;

  // Generate dynamic passcode PIN
  const passCode = `PK-${Math.floor(1000 + Math.random() * 9000)}`;
  const id = `res-${Math.floor(10000 + Math.random() * 90000)}`;

  const newReservation: Reservation = {
    id,
    slotId,
    slotCode: slot.code,
    zoneId: slot.zoneId,
    vehicleNumber,
    userEmail,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + hours * 3600000).toISOString(),
    hours,
    totalCost,
    passCode,
    status: "active"
  };

  // Update in-memory slot status
  slot.status = "reserved";
  slot.vehicleNumber = vehicleNumber;
  slot.reservedUntil = newReservation.endTime;

  reservations.push(newReservation);
  res.json({ success: true, reservation: newReservation });
});

// Cancel or Complete Reservation
app.post("/api/parking/release", (req, res) => {
  const { slotId } = req.body;
  const slot = slots.find(s => s.id === slotId);
  
  if (!slot) {
    return res.status(404).json({ error: "Slot not found" });
  }

  slot.status = "free";
  slot.vehicleNumber = undefined;
  slot.reservedUntil = undefined;

  // Mark associated reservation completed
  const reservation = reservations.find(r => r.slotId === slotId && r.status === "active");
  if (reservation) {
    reservation.status = "completed";
  }

  res.json({ success: true, slotId, status: slot.status });
});

// Edge Camera Computer Vision Detection Gateway
// Simulates a webcam frame analyzer triggering vacancy/occupancy changes
app.post("/api/parking/simulate-detect", (req, res) => {
  const { slotId, simulateState, vehicleNumber } = req.body;

  const slot = slots.find(s => s.id === slotId);
  if (!slot) {
    return res.status(404).json({ error: "Slot not found" });
  }

  const previousState = slot.status === "free" ? "free" : "occupied";
  
  if (simulateState === "occupied") {
    slot.status = "occupied";
    slot.vehicleNumber = vehicleNumber || `CV-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  } else {
    slot.status = "free";
    slot.vehicleNumber = undefined;
    slot.reservedUntil = undefined;
  }

  res.json({
    success: true,
    slotId,
    code: slot.code,
    previousState,
    newState: slot.status,
    vehicleNumber: slot.vehicleNumber,
    timestamp: new Date().toISOString()
  });
});

// Advanced Predictive AI Demand - Secure Server Side Gemini Endpoint
app.post("/api/parking/predict", async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "Gemini API is not configured. Please check your environment keys." });
  }

  const { zoneId, dayOfWeek, timeOfDay, weather, hasSpecialEvent } = req.body;

  const zone = zones.find(z => z.id === zoneId) || zones[0];
  const occupiedCount = slots.filter(s => s.zoneId === zone.id && s.status !== "free").length;
  const freeCount = slots.filter(s => s.zoneId === zone.id && s.status === "free").length;
  const occupancyRate = Math.round((occupiedCount / zone.totalSlots) * 100);

  const prompt = `You are the core intelligence of the Tech Nova INGENEIUM 5.0 Smart Parking Management System. 
Analyze the current slot states, environmental metrics, and execute an advanced predictive parking occupancy simulation.

Zone Name: ${zone.name}
Zone Base Rate: $${zone.baseRatePerHour}/hr
Current Occupied Spots: ${occupiedCount}/${zone.totalSlots} (${occupancyRate}% full)
Current Available Spots: ${freeCount}/${zone.totalSlots}
Day of the week: ${dayOfWeek || "Tuesday"}
Selected Target Hours: ${timeOfDay || "14:00 (Afternoon)"}
Current Weather Condition: ${weather || "Sunny"}
Special Local Event Near Venue: ${hasSpecialEvent ? "Yes, major event active nearby" : "No special events"}

Provide a highly realistic demand prediction model. Perform calculations to return:
1. Short proactive reasoning summary about the traffic and demand trends.
2. A suggested tariff multiplier (e.g. 1.0 for standard, up to 2.5 for peak/event rates).
3. Carbon reduction sustainability stats.
4. Generates exactly 8 sequential hourly prediction coordinates (e.g., if target hour is 14:00, generate for 14:00, 15:00, 16:00, 17:00, etc.) detailing predicted occupancy rate, estimated arrivals, and estimated departures.

Respond strictly in the provided JSON Schema format. Do not prepend any text or wrap in markdown blocks, except returning purely the JSON matching the requested schema structure.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["recommendation", "suggestedTariffRate", "forecastSummary", "confidenceScore", "sustainabilityScore", "hourlyPredictions"],
          properties: {
            recommendation: {
              type: Type.STRING,
              description: "A proactive optimization suggestion such as directing cars to Zone C, or notifying EV commuters."
            },
            suggestedTariffRate: {
              type: Type.NUMBER,
              description: "Tariff pricing premium multiplier. Normal rate is 1.0, high demand is 1.2 to 2.5"
            },
            forecastSummary: {
              type: Type.STRING,
              description: "A professional 2-sentence summary of expected trends over the next few hours based on day/weather/events."
            },
            confidenceScore: {
              type: Type.INTEGER,
              description: "Model prediction confidence percentage (e.g., 85, 92)"
            },
            sustainabilityScore: {
              type: Type.INTEGER,
              description: "Estimated eco-efficiency indicator representing optimized idle times (0 to 100)"
            },
            hourlyPredictions: {
              type: Type.ARRAY,
              description: "Exactly 8 sequential hours starting from current target hour",
              items: {
                type: Type.OBJECT,
                required: ["time", "expectedOccupancy", "estimatedArrivals", "estimatedDepartures"],
                properties: {
                  time: { type: Type.STRING, description: "Formatted hour e.g. '14:00', '15:00'" },
                  expectedOccupancy: { type: Type.INTEGER, description: "Percentage from 0 to 100" },
                  estimatedArrivals: { type: Type.INTEGER, description: "Predicted cars entering" },
                  estimatedDepartures: { type: Type.INTEGER, description: "Predicted cars exiting" }
                }
              }
            }
          }
        }
      }
    });

    const bodyText = response.text || "{}";
    res.json(JSON.parse(bodyText));
  } catch (err: any) {
    console.error("Gemini call failed:", err);
    // Fallback Mock Prediction in case API key is missing or limit is reached so application remains completely sturdy
    const generatedHours = [];
    const baseHour = parseInt((timeOfDay || "14:00").split(":")[0]) || 14;
    for (let i = 0; i < 8; i++) {
      const currentHourStr = `${String((baseHour + i) % 24).padStart(2, "0")}:00`;
      const wave = Math.sin((baseHour + i - 12) / 3) * 35 + 50;
      const expected = Math.min(100, Math.max(10, Math.round(wave + (hasSpecialEvent ? 25 : 0))));
      generatedHours.push({
        time: currentHourStr,
        expectedOccupancy: expected,
        estimatedArrivals: Math.round((expected / 10) * (Math.random() * 0.5 + 0.8)),
        estimatedDepartures: Math.round(((100 - expected) / 12) * (Math.random() * 0.5 + 0.8))
      });
    }

    res.json({
      recommendation: hasSpecialEvent 
        ? "Zone A is highly congested. Dynamically routing arriving non-EV vehicles to Solar Rooftop (Zone C) to save 8.5 minutes search time and reduce local COG emissions."
        : "Moderate parking flow expected. Recommending Eco-Friendly pricing rates to reward electric vehicles parking in Zone A EV nodes.",
      suggestedTariffRate: hasSpecialEvent ? 1.75 : 1.0,
      forecastSummary: `Fallback Prediction Mode active. Day of week: ${dayOfWeek}, weather: ${weather}. Solar canopy levels indicate normal capacity parameters with peak occupancy expected at sunset.`,
      confidenceScore: 78,
      sustainabilityScore: hasSpecialEvent ? 60 : 92,
      hourlyPredictions: generatedHours
    });
  }
});

// Interactive AI Parking Infrastructure Strategist Chatbot
app.post("/api/parking/advisor", async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "Gemini API is not configured." });
  }

  const { query, activeZoneId } = req.body;

  // Incorporate real state into the context
  const totalSpotsCount = slots.length;
  const occupiedSpotsCount = slots.filter(s => s.status === "occupied").length;
  const reservedSpotsCount = slots.filter(s => s.status === "reserved").length;
  const freeSpotsCount = slots.filter(s => s.status === "free").length;

  const contextPrompt = `You are the system strategist named 'Tech Nova INGENEIUM 5.0'. 
Your job is to answer the supervisor's questions regarding the smart parking system layout, parking flow optimization, environmental carbon tracking, or general setup guidelines.

Live Context:
- Total Managed Spaces: ${totalSpotsCount}
- Currently Vacant Slots: ${freeSpotsCount}
- Currently Occupied (CV Detected) Cars: ${occupiedSpotsCount}
- Reserved Spots (by App): ${reservedSpotsCount}
- Current active zone selected value: ${activeZoneId || "all"}

Formulate a concise, high-level, human, and professional answer that leverages these live statistics. Use 2-3 short bullet points in markdown where appropriate. Keep the output neat and brief, and direct. Do not refer to the internals.`;

  try {
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: contextPrompt
      }
    });

    const response = await chat.sendMessage({ message: query });
    res.json({ answer: response.text });
  } catch (err) {
    res.json({ 
      answer: `The Tech Nova AI Strategist is currently running in offline self-healing mode. 

**Infrastructure Snapshot:**
- Managed Spaces: ${totalSpotsCount} slots.
- Occupancy Distribution: ${occupiedSpotsCount} Parked, ${reservedSpotsCount} Booked, and ${freeSpotsCount} Available.
- Recommendation: Ensure edge cameras are wiped of any dust to maintain standard 98.4% slot scanning validation.` 
    });
  }
});


// -------------------------------------------------------------
// VITE OR STATIC SERVING MIDDLEWARE
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Parking Server booted successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
