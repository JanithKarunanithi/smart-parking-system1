import React, { useState, useEffect } from "react";
import { ParkingSlot, ParkingZone, Reservation } from "./types";
import ParkingGrid from "./components/ParkingGrid";
import DetectionSimulator from "./components/DetectionSimulator";
import ReservationPanel from "./components/ReservationPanel";
import { 
  Clock, ShieldAlert, Sparkles, LayoutDashboard, 
  MapPin, ShieldCheck, HelpCircle, HardDriveDownload 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"live" | "reserve">("live");
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");


  // Fetch initial zones and slots
  const fetchData = async () => {
    try {
      const [zonesRes, slotsRes] = await Promise.all([
        fetch("/api/parking/zones"),
        fetch("/api/parking/slots")
      ]);
      const zonesData = await zonesRes.json();
      const slotsData = await slotsRes.json();
      setZones(zonesData);
      setSlots(slotsData);
      
      // Auto-select first slot for illustration if none is selected
      if (slotsData.length > 0 && !selectedSlot) {
        setSelectedSlot(slotsData[0]);
      }
    } catch (err) {
      console.error("Failed to load full-stack state variables:", err);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup dynamic Clock
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    // Setup periodic slow polling to sync any background simulator activities
    const pollInterval = setInterval(() => {
      fetchData();
    }, 12000);

    return () => {
      clearInterval(timer);
      clearInterval(pollInterval);
    };
  }, []);

  // Update a slot's physical physical presence - simulated transitions
  const handleSimulateStateChange = async (slotId: string, simulateState: 'free' | 'occupied' | 'reserved', vehicleNo?: string) => {
    try {
      if (simulateState === "free") {
        await fetch("/api/parking/release", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slotId })
        });
      } else {
        await fetch("/api/parking/simulate-detect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slotId, simulateState, vehicleNumber: vehicleNo })
        });
      }



      await fetchData();
      
      // Update selectedSlot overlay state instantly
      setSlots(prevSlots => {
        const updated = prevSlots.map(s => {
          if (s.id === slotId) {
            const copy = { ...s, status: simulateState, vehicleNumber: vehicleNo };
            if (selectedSlot?.id === slotId) {
              setSelectedSlot(copy);
            }
            return copy;
          }
          return s;
        });
        return updated;
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger CV gateway transitions for specific slot id
  const handleTriggerDetection = async (slotId: string, simulateState: 'free' | 'occupied', vehicleNo?: string) => {
    await handleSimulateStateChange(slotId, simulateState, vehicleNo);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      
      {/* Dynamic Navigation Header */}
      <header className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl sticky top-4 z-30 max-w-7xl mx-auto w-full mt-4" id="main-app-header">
        <div className="px-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Title Block */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/20 text-white">
                P
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/50 border border-indigo-900 px-2 py-0.5 rounded">
                    INGENEIUM 5.0
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 uppercase">
                    SECTOR G-4
                  </span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white">PARK-IQ <span className="text-indigo-400 font-light">PRO</span></h1>
              </div>
            </div>

            {/* Dynamic Status / Time bar */}
            <div className="flex items-center gap-3 self-start md:self-auto">
              {/* Dynamic local clock */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs font-semibold text-slate-300 shadow-inner">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>{currentTime || "00:00:00"}</span>
              </div>

              {/* Server connection healthy */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-xs font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <span>SYSTEM ACTIVE</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        


        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 mb-6 gap-1" id="dash-navigation-tabs">
          <button
            onClick={() => setActiveTab("live")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all relative border-b-2 ${
              activeTab === "live"
                ? "border-indigo-500 text-indigo-400 bg-indigo-950/10 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Live Map & Camera Scan
          </button>

          <button
            onClick={() => setActiveTab("reserve")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all relative border-b-2 ${
              activeTab === "reserve"
                ? "border-indigo-500 text-indigo-400 bg-indigo-950/10 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Book Advance Reservation
          </button>
        </div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "live" && (
              <div className="space-y-6">
                {/* 2D Grid Visualizer & Slot Controller */}
                <ParkingGrid 
                  slots={slots} 
                  zones={zones} 
                  selectedSlot={selectedSlot}
                  onSelectSlot={(slot) => setSelectedSlot(slot)}
                  onSimulateStateChange={handleSimulateStateChange}
                />

                {/* Live CV Camera Scanner Feed Sim */}
                <DetectionSimulator 
                  slots={slots} 
                  onTriggerDetection={handleTriggerDetection} 
                />
              </div>
            )}

            {activeTab === "reserve" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left side book form */}
                <div className="lg:col-span-6">
                  <ReservationPanel 
                    zones={zones} 
                    slots={slots} 
                    onReservationCreated={async () => {
                      await fetchData();
                    }}
                    onCheckInCompleted={async (slotId, vehicleNo) => {
                      await handleSimulateStateChange(slotId, "occupied", vehicleNo);
                    }}
                  />
                </div>

                {/* Right side live layout visual overlay as reference guide */}
                <div className="lg:col-span-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                    <h4 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Live Facility Reference Layout
                    </h4>
                    <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">
                      Choose space configurations accordingly. Premium slots inside Zone A feature active rapid-charging ports. Solar Rooftop spaces inside Zone C offer premium shade and structural shield protection.
                    </p>

                    {/* Miniature interactive references layout */}
                    <div className="grid grid-cols-2 gap-3 mb-5 text-xs font-semibold">
                      <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
                        <span className="text-[9px] uppercase tracking-wider text-emerald-400">Premium Rapid node</span>
                        <h5 className="font-bold text-slate-200 mt-0.5">High Efficiency EV Charging</h5>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">Multiplier: 1.0x surge tariff</p>
                      </div>

                      <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl">
                        <span className="text-[9px] uppercase tracking-wider text-indigo-400">Wheelchair Node</span>
                        <h5 className="font-bold text-slate-200 mt-0.5">Dedicated Disabled Ramp</h5>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">Ground floor direct ramp lanes</p>
                      </div>
                    </div>

                    <div className="border border-slate-800 rounded-xl overflow-hidden shadow-md">
                      {/* Standard static legend block to explain layouts */}
                      <table className="w-full text-xs font-mono text-left">
                        <thead>
                          <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase text-slate-400">
                            <th className="p-3">Zone ID</th>
                            <th className="p-3">Hourly Rate</th>
                            <th className="p-3">Slot Scope</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300 bg-slate-900/40">
                          {zones.map(z => (
                            <tr key={z.id}>
                              <td className="p-3 font-bold text-slate-100">{z.id.toUpperCase()}</td>
                              <td className="p-3 font-black text-white">₹{z.baseRatePerHour}/hr</td>
                              <td className="p-3 text-[11px] text-slate-400">{z.id === "zone-a" ? "Slots 1-8 (Rapid Chargers)" : z.id === "zone-b" ? "Slots 9-20 (Standard)" : "Slots 21-28 (Solar)"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Aesthetic status credits footer aligned with Slide 5 */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 py-6 mt-12 text-center" id="app-credits-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-600 font-mono pt-4 max-w-5xl mx-auto">
            <p>© 2026 INGENEIUM 5.0. All rights preserved. Cloud Native edge-processor simulation framework.</p>
            <p className="mt-1 sm:mt-0 tracking-wider">SECURE TRANSMISSION ENCRYPTED</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
