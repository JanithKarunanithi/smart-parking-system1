import React, { useState } from "react";
import { ParkingZone, ParkingSlot, Reservation } from "../types";
import { Receipt, Mail, Car, Clock, Calendar, Ticket, Check, X, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ReservationPanelProps {
  zones: ParkingZone[];
  slots: ParkingSlot[];
  onReservationCreated: (newRes: Reservation) => void;
  onCheckInCompleted: (slotId: string, vehicleNo: string) => Promise<void>;
}

export default function ReservationPanel({
  zones,
  slots,
  onReservationCreated,
  onCheckInCompleted
}: ReservationPanelProps) {
  // Booking inputs
  const [selectedZoneId, setSelectedZoneId] = useState<string>("zone-a");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [vehicleNo, setVehicleNo] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [hours, setHours] = useState<number>(2);

  // Status & Receipts
  const [isReserving, setIsReserving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [activeTicket, setActiveTicket] = useState<Reservation | null>(null);

  // Available free slots in selected zone
  const availableSlots = slots.filter(s => s.zoneId === selectedZoneId && s.status === "free");
  const selectedZone = zones.find(z => z.id === selectedZoneId) || zones[0];
  const computedTotal = selectedZone.baseRatePerHour * hours;

  // Book Reservation Handler
  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedSlotId) {
      setErrorMessage("Please choose a physical parking slot first.");
      return;
    }
    if (!vehicleNo.trim()) {
      setErrorMessage("Please fill in your Vehicle Registration/License Number.");
      return;
    }
    if (!userEmail.trim() || !userEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address for receiving your pass.");
      return;
    }

    setIsReserving(true);
    try {
      const response = await fetch("/api/parking/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlotId,
          vehicleNumber: vehicleNo.trim().toUpperCase(),
          userEmail: userEmail.trim(),
          hours
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Reservation failed.");
      }

      onReservationCreated(data.reservation);
      setActiveTicket(data.reservation);
      
      // Clear inputs
      setSelectedSlotId("");
      setVehicleNo("");
      setUserEmail("");
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong.");
    } finally {
      setIsReserving(false);
    }
  };

  // Simulate vehicle pulling up and checking in via passcode/QR codes
  const handleSimulateCheckIn = async () => {
    if (!activeTicket) return;
    try {
      await onCheckInCompleted(activeTicket.slotId, activeTicket.vehicleNumber);
      setActiveTicket(prev => prev ? { ...prev, status: "completed" } : null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col justify-between text-slate-100 font-sans" id="reservation-form-widget">
      {/* Upper header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/20">
        <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
          <Ticket className="w-5 h-5 text-indigo-400" />
          Advance Slot Reservation
        </h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Lock in premium, EV charging, or solar rooftop slots before arriving at the venue.
        </p>
      </div>

      <div className="p-6 flex-1">
        <AnimatePresence mode="wait">
          {!activeTicket ? (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleReserve}
              className="space-y-4"
            >
              {/* Zone selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">Select Facility Zone</label>
                <div className="grid grid-cols-3 gap-2">
                  {zones.map(z => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => {
                        setSelectedZoneId(z.id);
                        setSelectedSlotId("");
                      }}
                      className={`px-2.5 py-2 rounded-xl text-center border text-[11px] font-bold transition-all cursor-pointer ${
                        selectedZoneId === z.id
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-950"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      <div>{z.id === "zone-a" ? "⚡ Premium" : z.id === "zone-b" ? "🚗 Main" : "☀️ Solar"}</div>
                      <div className="text-[9px] font-normal opacity-80 mt-0.5">₹{z.baseRatePerHour}/hr</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical slot Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                  Choose Available Bay ({availableSlots.length} vacant)
                </label>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-lg">
                    {availableSlots.map(slot => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`py-1 rounded-md text-xs font-bold font-mono transition-all border cursor-pointer ${
                          selectedSlotId === slot.id
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-indigo-950 hover:text-indigo-400"
                        }`}
                      >
                        {slot.code}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center bg-rose-950/40 border border-rose-900/60 text-rose-400 text-xs rounded-lg">
                    No vacant slots inside {selectedZone.name}. Please select another zone!
                  </div>
                )}
              </div>

              {/* Vehicle registration */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 font-mono">
                  Vehicle Registration Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Car className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TS-09-EA-9999"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full text-xs pl-10 pr-3 py-2 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-950 text-slate-200 placeholder-slate-600 uppercase font-mono font-bold"
                  />
                </div>
              </div>

              {/* User email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 font-mono">
                  Commuter Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full text-xs pl-10 pr-3 py-2 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-950 text-slate-200 placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Hours Duration */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                  Reservation duration (hours)
                </label>
                <div className="grid grid-cols-4 gap-1.5 font-mono">
                  {[1, 2, 4, 8].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHours(h)}
                      className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        hours === h
                          ? "bg-slate-100 text-slate-950 border-white font-black"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                      }`}
                    >
                      {h} {h === 1 ? "Hr" : "Hrs"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error box */}
              {errorMessage && (
                <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-xs text-rose-450 text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Cost breakdown receipt */}
              <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-3 flex justify-between items-center text-xs">
                <div>
                  <h5 className="font-bold text-slate-200">Dynamic Pricing Summary</h5>
                  <p className="text-[10px] text-slate-400 font-mono">
                    ₹{selectedZone.baseRatePerHour}/hr × {hours} hours
                  </p>
                </div>
                <h4 className="text-base font-extrabold text-indigo-400 font-sans">₹{computedTotal.toFixed(2)}</h4>
              </div>

              <button
                type="submit"
                disabled={isReserving || availableSlots.length === 0}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-400 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isReserving ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Locking Space...
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    Book Parking Ticket
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            // Holographic Premium Parking Ticket
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="relative border-2 border-slate-100 rounded-2xl bg-slate-950 p-6 shadow-xl text-white overflow-hidden">
                {/* Background lighting flare */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-600 rounded-full blur-2xl opacity-40"></div>
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-600 rounded-full blur-2xl opacity-30"></div>

                {/* Ticket Header */}
                <div className="flex justify-between items-start pb-4 border-b border-white/10">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-[#a5b4fc]">TECH NOVA SECURITY</span>
                    <h4 className="text-sm font-extrabold font-mono tracking-tight mt-0.5">INGENEIUM 5.0 PASS</h4>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500 text-black rounded text-[9px] font-bold uppercase tracking-wider font-mono">
                    SECURED
                  </span>
                </div>

                {/* Grid info */}
                <div className="grid grid-cols-2 gap-4 mt-5 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Parking Bay</span>
                    <strong className="text-lg text-emerald-400 font-black">{activeTicket.slotCode}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Hologram PIN</span>
                    <strong className="text-lg text-indigo-300 font-bold">{activeTicket.passCode}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Vehicle No</span>
                    <strong className="text-slate-200">{activeTicket.vehicleNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Duration</span>
                    <strong className="text-slate-200">{activeTicket.hours} HRs</strong>
                  </div>
                </div>

                {/* Simulated QR Code scan */}
                <div className="flex flex-col items-center justify-center py-5 border-t border-b border-white/5 my-4">
                  {/* Decorative Vector QR Box */}
                  <div className="bg-white p-2.5 rounded-lg border-2 border-[#818cf8] w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100">
                      {/* Corners */}
                      <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                      <rect x="5" y="5" width="20" height="20" fill="white" />
                      <rect x="10" y="10" width="10" height="10" fill="currentColor" />

                      <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                      <rect x="75" y="5" width="20" height="20" fill="white" />
                      <rect x="80" y="10" width="10" height="10" fill="currentColor" />

                      <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                      <rect x="5" y="75" width="20" height="20" fill="white" />
                      <rect x="10" y="80" width="10" height="10" fill="currentColor" />

                      {/* Random blocks representing data payload */}
                      <rect x="40" y="10" width="15" height="15" fill="currentColor" />
                      <rect x="45" y="35" width="20" height="10" fill="currentColor" />
                      <rect x="15" y="45" width="10" height="15" fill="currentColor" />
                      <rect x="50" y="70" width="15" height="15" fill="currentColor" />
                      <rect x="70" y="45" width="20" height="25" fill="currentColor" />
                      <rect x="35" y="75" width="10" height="10" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono tracking-wide mt-2">Scan QR gateway at entry arm</span>
                </div>

                {/* Dynamic Ticket Footer */}
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>EXP: {new Date(activeTicket.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="text-right">PAID: ₹{activeTicket.totalCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Physical checkin trigger as helpful utility */}
              {activeTicket.status === "active" && (
                <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-4 space-y-3">
                  <div>
                    <h5 className="text-xs font-bold text-indigo-300">Driveup Simulator (Test Ride)</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                      Simulate physical check-in. This triggers simulated cameras to classify slot {activeTicket.slotCode} as occupied.
                    </p>
                  </div>
                  <button
                    onClick={handleSimulateCheckIn}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md"
                  >
                    Simulate Drive-In Check-In
                  </button>
                </div>
              )}

              {activeTicket.status === "completed" && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-xs text-emerald-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Commuter Checked-In successfully
                  </span>
                  <button
                    onClick={() => setActiveTicket(null)}
                    className="text-[11px] font-bold text-[#10b981] hover:bg-emerald-900/30 px-2 py-1 rounded transition-all cursor-pointer"
                  >
                    Ready for next booking
                  </button>
                </div>
              )}

              <button
                onClick={() => setActiveTicket(null)}
                className="w-full py-2 text-slate-400 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Close Ticket View
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
