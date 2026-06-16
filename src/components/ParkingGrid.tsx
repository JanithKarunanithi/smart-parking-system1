import React, { useState, useEffect } from "react";
import { ParkingSlot, ParkingZone } from "../types";
import { Zap, ShieldAlert, CheckCircle2, Navigation, CircleAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ParkingGridProps {
  slots: ParkingSlot[];
  zones: ParkingZone[];
  onSelectSlot: (slot: ParkingSlot) => void;
  selectedSlot: ParkingSlot | null;
  onSimulateStateChange: (slotId: string, newState: 'free' | 'occupied' | 'reserved', vehicleNo?: string) => void;
}

export default function ParkingGrid({
  slots,
  zones,
  onSelectSlot,
  selectedSlot,
  onSimulateStateChange
}: ParkingGridProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [routingSlot, setRoutingSlot] = useState<string | null>(null);

  // Filter slots by selected Zone
  const filteredSlots = slots.filter(s => activeTab === "all" || s.zoneId === activeTab);

  // Stats Counters
  const totalSpots = slots.length;
  const occupiedSpots = slots.filter(s => s.status === "occupied").length;
  const reservedSpots = slots.filter(s => s.status === "reserved").length;
  const vacantSpots = slots.filter(s => s.status === "free").length;

  const evSpots = slots.filter(s => s.type === "ev");
  const evVacant = evSpots.filter(s => s.status === "free").length;

  const disabledSpots = slots.filter(s => s.type === "disabled");
  const disabledVacant = disabledSpots.filter(s => s.status === "free").length;

  // Compute navigation path based on slot coordinates
  // Start points from Entrance: x=3, y=50
  const getNavigationPath = (slot: ParkingSlot) => {
    const startX = 3;
    const startY = 48; // entrance driveway
    const slotX = slot.x + slot.width / 2;
    const slotY = slot.y + slot.height / 2;

    // Standard road grid coordinates:
    // Driveway A is at y=25 (top horizontal lane)
    // Driveway B is at y=50 (middle horizontal lane)
    // Driveway C is at y=72 (bottom horizontal lane)
    // Vertical corridor is at x=95 (end horizontal loop) or x=48
    let midY = 48;
    if (slot.zoneId === "zone-a") {
      midY = 24; // top lane
    } else if (slot.zoneId === "zone-b") {
      midY = slot.y < 48 ? 32 : 68; // standard middle lanes
    } else {
      midY = 72; // bottom lane
    }

    // Path string: Move to start, then travel horizontally along center entry driveway,
    // turn vertically to reach target lane, travel horizontally to space, then turn into space.
    // Let's create an elegant smooth routing line
    return `M ${startX} ${startY} L 50 ${startY} L 50 ${midY} L ${slotX} ${midY} L ${slotX} ${slotY}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100" id="parking-grid-widget">
      {/* Top Header & Counters */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-100 tracking-tight">Facility Slot Visualizer & Live Map</h3>
            <p className="text-xs text-slate-400 mt-1">
              Interactive 2D Floor Plan. Real-time slot status detected via computer vision cameras.
            </p>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono bg-slate-950 px-3 py-2 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 block border border-slate-900 shadow-sm shadow-emerald-950"></span>
              <span className="text-slate-300">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-500 block border border-slate-900 shadow-sm shadow-slate-950"></span>
              <span className="text-slate-300">Occupied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 block border border-slate-900 shadow-sm shadow-amber-950"></span>
              <span className="text-slate-300">Reserved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500 block border border-slate-900 shadow-sm shadow-indigo-950"></span>
              <span className="text-slate-300">Selected</span>
            </div>
          </div>
        </div>

        {/* Counter Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
          <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between shadow-inner">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Managed Spots</p>
              <h4 className="text-2xl font-bold font-sans text-slate-100 mt-0.5">{totalSpots}</h4>
            </div>
            <span className="p-1.5 bg-slate-900 text-slate-400 rounded-lg text-xs font-semibold">Total</span>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-xl flex items-center justify-between shadow-inner">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#10b981] font-semibold">Vacant</p>
              <h4 className="text-2xl font-bold font-sans text-emerald-400 mt-0.5">{vacantSpots}</h4>
            </div>
            <span className="p-1.5 bg-emerald-900/50 text-emerald-300 rounded-lg text-xs font-semibold">{Math.round((vacantSpots/totalSpots)*100)}%</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between shadow-inner">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Occupied</p>
              <h4 className="text-2xl font-bold font-sans text-slate-300 mt-0.5">{occupiedSpots}</h4>
            </div>
            <span className="p-1.5 bg-slate-900 text-slate-400 rounded-lg text-xs font-semibold">{Math.round((occupiedSpots/totalSpots)*100)}%</span>
          </div>

          <div className="bg-amber-950/20 border border-amber-900/40 p-3 rounded-xl flex items-center justify-between shadow-inner">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold">Booked App</p>
              <h4 className="text-2xl font-bold font-sans text-amber-400 mt-0.5">{reservedSpots}</h4>
            </div>
            <span className="p-1.5 bg-amber-900/50 text-amber-300 rounded-lg text-xs font-semibold">{reservedSpots}</span>
          </div>

          <div className="bg-sky-950/20 border border-sky-900/40 p-3 rounded-xl flex items-center justify-between col-span-2 lg:col-span-1 shadow-inner">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-sky-400 font-semibold">Specialists</p>
              <h4 className="text-sm font-semibold text-slate-200 mt-1 flex flex-wrap gap-x-2">
                <span>⚡ EV: <strong className="text-sky-300 font-bold">{evVacant}</strong></span>
                <span>♿ Acc: <strong className="text-sky-300 font-bold">{disabledVacant}</strong></span>
              </h4>
            </div>
            <span className="p-1.5 bg-sky-900 text-sky-300 rounded-lg text-xs font-semibold">Free</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/10 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-indigo-600 text-white shadow-xs font-bold"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            All Zones
          </button>
          {zones.map(zone => (
            <button
              key={zone.id}
              onClick={() => setActiveTab(zone.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === zone.id
                  ? "bg-indigo-600 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {zone.id === "zone-a" ? "⚡ Zone A" : zone.id === "zone-b" ? "🚗 Zone B" : "☀️ Zone C"}
            </button>
          ))}
        </div>

        {routingSlot && (
          <button
            onClick={() => setRoutingSlot(null)}
            className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all"
          >
            Clear Route Guidance
          </button>
        )}
      </div>

      {/* Interactive 2D Vector Map Canvas */}
      <div className="p-6 bg-slate-900 border-b border-slate-800 relative max-w-full overflow-hidden">
        {/* Driveway lane overlay markers */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-bold font-mono tracking-widest text-slate-500 pointer-events-none select-none uppercase transform rotate-90 origin-left">
          ✈ Entry Driveway
        </div>

        {/* Dynamic Map wrapper */}
        <div className="relative w-full aspect-[21/9] min-w-[700px] bg-slate-950 border-4 border-slate-800 rounded-xl overflow-hidden shadow-inner">
          {/* Floor grid backdrops */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

          {/* Core SVG Map */}
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Driveway Lanes */}
            {/* Top Driveway Lane */}
            <rect x="2" y="24" width="96" height="10" fill="#1e293b" fillOpacity="0.4" rx="2" stroke="#334155" strokeWidth="0.5" strokeDasharray="1 1" />
            <line x1="2" y1="29" x2="98" y2="29" stroke="#fed7aa" strokeWidth="0.25" strokeDasharray="2 2" strokeOpacity="0.4" />

            {/* Central Entrance Lane */}
            <rect x="2" y="44" width="96" height="10" fill="#1e293b" fillOpacity="0.6" rx="2" stroke="#334155" strokeWidth="0.5" />
            <line x1="2" y1="49" x2="98" y2="49" stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="3 3" />
            <text x="3" y="48" fill="#fbbf24" fontSize="2.5" fontWeight="bold" fontFamily="monospace" letterSpacing="0.2">➡ ENTRANCE GATE</text>

            {/* Bottom Driveway Lane */}
            <rect x="2" y="72" width="96" height="8" fill="#1e293b" fillOpacity="0.4" rx="2" stroke="#334155" strokeWidth="0.5" strokeDasharray="1 1" />
            <line x1="2" y1="76" x2="98" y2="76" stroke="#fed7aa" strokeWidth="0.25" strokeDasharray="2 2" strokeOpacity="0.4" />

            {/* Simulated Active Routing Line Overlay */}
            {routingSlot && (() => {
              const targetSlot = slots.find(s => s.id === routingSlot);
              if (!targetSlot) return null;
              return (
                <>
                  {/* Glowing shadow line */}
                  <path
                    d={getNavigationPath(targetSlot)}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-40 blur-[2px]"
                  />
                  {/* Primary dash-animating path */}
                  <path
                    d={getNavigationPath(targetSlot)}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="1.0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="4 2"
                    className="animate-[dash_1.5s_linear_infinite]"
                  />
                  {/* Target slot radar ripple */}
                  <circle
                    cx={targetSlot.x + targetSlot.width / 2}
                    cy={targetSlot.y + targetSlot.height / 2}
                    r="4"
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="0.8"
                    className="animate-ping"
                  />
                </>
              );
            })()}

            {/* Render Parking Slots */}
            {filteredSlots.map(slot => {
              const isSelected = selectedSlot?.id === slot.id;
              const isRoutingTarget = routingSlot === slot.id;
              
              // Dynamic coloring based on status
              let strokeColor = "#334155";
              let fillColor = "#0f172a";
              let textBgColor = "#1e293b";
              let typeLabel = "";

              if (slot.status === "free") {
                strokeColor = isSelected ? "#3b82f6" : "#10b981";
                fillColor = isSelected ? "#1d4ed830" : "#064e3b40";
                textBgColor = "#065f46";
              } else if (slot.status === "occupied") {
                strokeColor = isSelected ? "#3b82f6" : "#475569";
                fillColor = isSelected ? "#1d4ed830" : "#1e293b80";
                textBgColor = "#334155";
              } else if (slot.status === "reserved") {
                strokeColor = isSelected ? "#3b82f6" : "#f59e0b";
                fillColor = isSelected ? "#1d4ed830" : "#78350f40";
                textBgColor = "#92400e";
              }

              // Highlight outline if it is the routing target
              if (isRoutingTarget) {
                strokeColor = "#10b981";
              }

              return (
                <g
                  key={slot.id}
                  onClick={() => {
                    onSelectSlot(slot);
                    // Automatically trigger routing route to show off innovation
                    setRoutingSlot(slot.id);
                  }}
                  className="cursor-pointer group transition-all duration-300"
                >
                  {/* Parking Slot Outer Box */}
                  <rect
                    x={slot.x}
                    y={slot.y}
                    width={slot.width}
                    height={slot.height}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? "1.5" : isRoutingTarget ? "1.4" : "0.75"}
                    rx="1.5"
                    className="transition-all duration-350"
                  />

                  {/* Spot Code label */}
                  <rect
                    x={slot.x + 1}
                    y={slot.y + 1}
                    width={slot.width - 2}
                    height="4"
                    fill={textBgColor}
                    rx="0.5"
                  />
                  <text
                    x={slot.x + slot.width / 2}
                    y={slot.y + 4}
                    fill="#f8fafc"
                    fontSize="2.4"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {slot.code}
                  </text>

                  {/* EV Charger Indicator Icon */}
                  {slot.type === "ev" && (
                    <g transform={`translate(${slot.x + slot.width / 2 - 1.5}, ${slot.y + 7})`}>
                      <path d="M1 0 L0 2 H2 L1 4" stroke="#60a5fa" strokeWidth="0.4" fill="none" />
                      <circle cx="1" cy="2" r="1.5" stroke="#60a5fa" strokeWidth="0.25" fill="none" />
                    </g>
                  )}

                  {/* Acc/Disabled Indicator Icon */}
                  {slot.type === "disabled" && (
                    <text
                      x={slot.x + slot.width / 2}
                      y={slot.y + 10}
                      fill="#3b82f6"
                      fontSize="2.8"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ♿
                    </text>
                  )}

                  {/* Car Outline representation when occupied */}
                  {slot.status === "occupied" && (
                    <g className="opacity-80">
                      {/* Simulated Car Body top-down view */}
                      <rect
                        x={slot.x + 1.2}
                        y={slot.y + 5.5}
                        width={slot.width - 2.4}
                        height={slot.height - 7.5}
                        fill="#cbd5e1"
                        rx="1"
                        stroke="#64748b"
                        strokeWidth="0.3"
                      />
                      {/* Windshield */}
                      <rect
                        x={slot.x + 2}
                        y={slot.y + 7}
                        width={slot.width - 4}
                        height="1.5"
                        fill="#1e293b"
                        rx="0.3"
                      />
                      {/* Headlights */}
                      <circle cx={slot.x + 2.5} cy={slot.y + 6} r="0.3" fill="#fde047" />
                      <circle cx={slot.x + slot.width - 2.5} cy={slot.y + 6} r="0.3" fill="#fde047" />
                    </g>
                  )}

                  {/* Vehicle Number overlay on hover */}
                  {slot.vehicleNumber && (
                    <text
                      x={slot.x + slot.width / 2}
                      y={slot.y + slot.height - 1}
                      fill="#e2e8f0"
                      fontSize="1.6"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="hidden group-hover:block opacity-90 fill-slate-300 font-semibold"
                    >
                      {slot.vehicleNumber.split("-").pop()}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Selected Slot Information Panel */}
      <div className="p-6 bg-slate-950/20 border-t border-slate-800/60">
        <AnimatePresence mode="wait">
          {selectedSlot ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200"
              key={selectedSlot.id}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    selectedSlot.status === "free" ? "bg-emerald-950/80 text-emerald-400 border border-emerald-900/50" :
                    selectedSlot.status === "reserved" ? "bg-amber-950/80 text-amber-400 border border-amber-900/50" : "bg-slate-900 text-slate-300 border border-slate-800"
                  }`}>
                    <Navigation className="w-5 h-5 mx-auto" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base">Parking Slot {selectedSlot.code}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        selectedSlot.type === "ev" ? "bg-blue-950/80 text-blue-400 border border-blue-900/60" :
                        selectedSlot.type === "disabled" ? "bg-indigo-950/80 text-indigo-400 border border-indigo-900/60" :
                        selectedSlot.type === "compact" ? "bg-purple-950/80 text-purple-400 border border-purple-900/60" : "bg-slate-900 text-slate-400 border border-slate-850"
                      }`}>
                        {selectedSlot.type}Node
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Zone: {zones.find(z => z.id === selectedSlot.zoneId)?.name || selectedSlot.zoneId.toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-bold font-mono rounded-full uppercase tracking-wider ${
                    selectedSlot.status === "free" ? "bg-emerald-500 text-slate-950" :
                    selectedSlot.status === "reserved" ? "bg-amber-500 text-slate-950" : "bg-slate-500 text-white"
                  }`}>
                    {selectedSlot.status}
                  </span>
                </div>
              </div>

              {/* Slot Actions and Details */}
              <div className="mt-4 pt-4 border-t border-slate-850 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center">
                {/* Details */}
                <div className="text-xs text-slate-300 font-mono space-y-1">
                  <div>• Hourly Rate: <strong className="text-white">₹{zones.find(z => z.id === selectedSlot.zoneId)?.baseRatePerHour}/hr</strong></div>
                  {selectedSlot.status === "occupied" && (
                    <div className="text-rose-400 font-semibold">• Parked Vehicle: {selectedSlot.vehicleNumber || "Unknown Auto"}</div>
                  )}
                  {selectedSlot.status === "reserved" && (
                    <div className="text-amber-400 font-semibold">
                      • Booked Until: {selectedSlot.reservedUntil ? new Date(selectedSlot.reservedUntil).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "N/A"}
                    </div>
                  )}
                  {selectedSlot.status === "free" && (
                    <div className="text-emerald-400 font-semibold">• Status: Vacuum Clean & Vacant</div>
                  )}
                </div>

                {/* Dynamic Smart Routing Status */}
                <div className="text-xs">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    <span>Real-Time Routing Engaged</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Green dashed line animations highlight turn-by-turn routing from the main entrance gate.
                  </p>
                </div>

                {/* Simulated Admin State Control Panel */}
                <div className="flex flex-wrap gap-1.5 sm:justify-end font-mono">
                  {selectedSlot.status !== "free" ? (
                    <button
                      onClick={() => onSimulateStateChange(selectedSlot.id, "free")}
                      className="px-3 py-1.5 bg-slate-800 text-slate-100 hover:bg-slate-700 text-xs font-bold rounded-lg shadow-md transition-all w-full sm:w-auto border border-slate-700"
                    >
                      Depart / Release Slot
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          const num = `CV-${Math.floor(1000 + Math.random() * 9000)}`;
                          onSimulateStateChange(selectedSlot.id, "occupied", num);
                        }}
                        className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold rounded-lg shadow-md transition-all"
                      >
                        Simulate Park (In-Slot Sensor)
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
              <CircleAlert className="w-8 h-8 text-slate-700 mx-auto" />
              <p className="text-sm text-slate-300 font-bold mt-2">No space selected</p>
              <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
                Click on any parking slot coordinate on the 2D map above to inspect live metrics, simulate hardware states, or trace vector driving directions.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Styled animation styles */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}</style>
    </div>
  );
}
