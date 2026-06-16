import React, { useState, useEffect } from "react";
import { ParkingSlot } from "../types";
import { Camera, RefreshCw, Cpu, Activity, Play, Pause, Zap } from "lucide-react";
import { motion } from "motion/react";

interface DetectionSimulatorProps {
  slots: ParkingSlot[];
  onTriggerDetection: (slotId: string, simulateState: 'free' | 'occupied', vehicleNo?: string) => Promise<void>;
}

export default function DetectionSimulator({ slots, onTriggerDetection }: DetectionSimulatorProps) {
  // We'll simulate CCTV camera #1 monitoring slots A-01, A-02, A-03, A-04
  const targetSlots = slots.filter(s => ["slot-a1", "slot-a2", "slot-a3", "slot-a4"].includes(s.id));
  const [inferenceLatency, setInferenceLatency] = useState<number>(12);
  const [fps, setFps] = useState<number>(30);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [systemLogs, setSystemLogs] = useState<Array<{ time: string; msg: string; type: 'info' | 'success' | 'warn' }>>([
    { time: new Date().toLocaleTimeString(), msg: "MobileNetV3 Edge Detector loaded successfully.", type: "success" },
    { time: new Date().toLocaleTimeString(), msg: "CCTV Camera Node #1 initialized on RTSP port 554.", type: "info" },
    { time: new Date().toLocaleTimeString(), msg: "Monitoring slots A-01 through A-04 for frame variations.", type: "info" }
  ]);
  const [customPlate, setCustomPlate] = useState<string>("");

  useEffect(() => {
    if (!isScanning) return;

    // Simulate minor frame telemetry adjustments to look highly authentic
    const interval = setInterval(() => {
      setInferenceLatency(Math.floor(8 + Math.random() * 8));
      setFps(Math.round(29.4 + Math.random() * 1.2));
    }, 3000);

    return () => clearInterval(interval);
  }, [isScanning]);

  const addLog = (msg: string, type: 'info' | 'success' | 'warn') => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [{ time: timestamp, msg, type }, ...prev.slice(0, 10)]);
  };

  const handleSimulateArrival = async (slotId: string, code: string) => {
    // Generate randomized license plate or use custom
    const cleanPlate = customPlate.trim().toUpperCase();
    const plate = cleanPlate || `TS-${Math.floor(10 + Math.random() * 89)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(1000 + Math.random() * 8999)}`;
    
    addLog(`Sensor trigger: Vehicle arriving at spot ${code}`, "info");
    addLog(`Neural net identifying plate structure - decoding...`, "info");
    
    try {
      await onTriggerDetection(slotId, "occupied", plate);
      addLog(`Object classifier positive occupancy on ${code}. Plate identified: ${plate}`, "success");
      setCustomPlate("");
    } catch (err) {
      addLog(`Failed to communicate slot update.`, "warn");
    }
  };

  const handleSimulateDeparture = async (slotId: string, code: string) => {
    addLog(`Sensor trigger: Displacement detected at spot ${code}`, "info");
    
    try {
      await onTriggerDetection(slotId, "free");
      addLog(`Neural net confirmed vacancy state for spot ${code}.`, "success");
    } catch (err) {
      addLog(`Failed to communicate slot release.`, "warn");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100" id="cv-simulator-widget">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isScanning ? "bg-red-400" : "bg-slate-700"}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isScanning ? "bg-rose-500" : "bg-slate-500"}`}></span>
            </span>
            <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-1.5">
              <Camera className="w-5 h-5 text-indigo-400" />
              Software-Based Computer Vision Edge Simulator
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Minimizes hardware deployment costs by utilizing existing security feeds to track spot vacancies.
          </p>
        </div>

        {/* Video stream status toggles */}
        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={() => {
              setIsScanning(!isScanning);
              addLog(isScanning ? "Telemetry pipeline paused." : "Telemetry pipeline resumed.", isScanning ? "warn" : "info");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isScanning 
                ? "bg-rose-950/40 text-rose-400 border border-rose-900/60 hover:bg-rose-900/30" 
                : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
            }`}
          >
            {isScanning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                Pause Telemetry
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Resume Stream
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* CCTV HTML Live Feed Simulator Screen (5 Cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="relative aspect-[16/10] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg select-none">
            {/* Camera Overlays */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/80 px-2 py-1 rounded-md text-[10px] font-mono text-slate-300 backdrop-blur-xs z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>CCTV_CAM_A1 (GROUNDプレミアム)</span>
            </div>
            
            <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-400 font-semibold z-10 bg-slate-900/40 px-2 py-0.5 rounded-sm">
              {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </div>

            {/* Scanning Laser FX */}
            {isScanning && (
              <div className="absolute left-0 right-0 h-[1.5px] bg-indigo-500/80 shadow-[0_0_10px_#6366f1] animate-[sweep_4s_ease-in-out_infinite] z-20 pointer-events-none"></div>
            )}

            {/* Simulated Live Frame Grid */}
            <div className="grid grid-cols-2 gap-2 p-3 h-full pt-10">
              {targetSlots.map(slot => {
                const occupied = slot.status === "occupied";
                const isSelected = slot.status === "reserved";

                return (
                  <div
                    key={slot.id}
                    className={`relative border-2 rounded-lg transition-all duration-300 flex flex-col justify-end p-2 ${
                      occupied 
                        ? "border-rose-500/80 bg-rose-500/5" 
                        : isSelected 
                        ? "border-amber-500/40 bg-amber-500/5" 
                        : "border-emerald-500/80 bg-emerald-500/5"
                    }`}
                  >
                    {/* Bounding box Corner brackets layout */}
                    <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-inherit"></div>
                    <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-inherit"></div>
                    <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-inherit"></div>
                    <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-inherit"></div>

                    {/* Camera Spot Info Label */}
                    <div className="absolute top-2 left-2 flex flex-col">
                      <span className="text-[10px] font-bold text-white bg-slate-900 px-1 py-0.5 rounded-sm font-mono tracking-tight">
                        Bay {slot.code}
                      </span>
                    </div>

                    {/* Live Video placeholder graphics */}
                    <div className="flex-1 flex items-center justify-center pt-2">
                      {occupied ? (
                        <div className="text-center">
                          <span className="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">🚗</span>
                          <p className="text-[9px] font-bold text-rose-300 font-mono tracking-tighter mt-1 bg-slate-900/60 px-1.5 py-0.5 rounded-sm">
                            {slot.vehicleNumber || "AUTO DETECTED"}
                          </p>
                        </div>
                      ) : isSelected ? (
                        <div className="text-center">
                          <span className="text-2xl opacity-50">⏳</span>
                          <p className="text-[9px] font-bold text-amber-300 font-mono mt-1 bg-slate-900/60 px-1 rounded-sm">
                            RESERVED APP
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <span className="text-3xl opacity-20 filter grayscale">🟢</span>
                          <p className="text-[9px] font-semibold text-emerald-400 font-mono mt-1 tracking-wider bg-slate-900/60 px-1 rounded-sm">
                            VACANT
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Analytical Box Classification Label */}
                    <div className="mt-1 flex items-center justify-between text-[9px] font-bold font-mono">
                      <span className={occupied ? "text-rose-400" : isSelected ? "text-amber-400" : "text-emerald-400"}>
                        {occupied ? "■ OCCUPIED" : isSelected ? "■ RESERVED" : "■ VACANT"}
                      </span>
                      <span className="text-slate-400 text-right">
                        {occupied ? "Conf: 98.4%" : isSelected ? "Conf: 99.1%" : "Conf: 99.8%"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inference diagnostics */}
          <div className="grid grid-cols-3 gap-2 mt-3 font-mono text-[10px] text-slate-400 bg-slate-950 border border-slate-800 p-2.5 rounded-lg shadow-inner">
            <div className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              <span>Inference: <strong className="text-[#38bdf8]">{isScanning ? `${inferenceLatency}ms` : "OFF"}</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span>Model Output: <strong className="text-slate-200">{isScanning ? `${fps} FPS` : "STANDBY"}</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>GPU Load: <strong className="text-slate-200">{isScanning ? "14.2%" : "0.0%"}</strong></span>
            </div>
          </div>
        </div>

        {/* CV Camera Trigger Form Panels (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1 font-mono">Administrative Terminal</span>
            <h4 className="text-sm font-bold text-white">Simulate Real-Time CV Transitions</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Test how the backend system automatically recalculates dynamic slot parameters, schedules notifications, and update analytics dynamically when vehicles park.
            </p>

            {/* Custom license input */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-400 mb-1 font-mono">
                Custom License Plate (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. DL-6C-AX-1049"
                value={customPlate}
                onChange={(e) => setCustomPlate(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-950 text-slate-200 placeholder-slate-600"
              />
            </div>

            {/* Trigger actions list */}
            <div className="space-y-3 mt-4">
              {targetSlots.map(slot => (
                <div key={slot.id} className="flex items-center justify-between p-2.5 border border-slate-800 rounded-xl bg-slate-950/20 hover:bg-slate-950/65 transition-all">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-200">{slot.code}</span>
                    <span className={`w-2 h-2 rounded-full ${slot.status === "occupied" ? "bg-rose-500" : "bg-emerald-500"}`}></span>
                    <span className="text-[10px] text-slate-500 font-mono capitalize">({slot.status})</span>
                  </div>

                  <div className="flex gap-1.5 font-mono">
                    {slot.status !== "occupied" ? (
                      <button
                        onClick={() => handleSimulateArrival(slot.id, slot.code)}
                        className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/50 text-rose-450 border border-rose-900/55 text-[10px] font-bold rounded-md transition-all flex items-center gap-0.5"
                      >
                        ⚡ Park Car
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSimulateDeparture(slot.id, slot.code)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold rounded-md transition-all flex items-center gap-0.5"
                      >
                        📤 Depart
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Mini Logs */}
          <div className="mt-5 bg-slate-950 text-slate-300 rounded-xl p-3 font-mono text-[10px] h-36 overflow-y-auto flex flex-col gap-1 shadow-inner border border-slate-850">
            <span className="text-slate-500 border-b border-slate-850 pb-1 mb-1 block sticky top-0 bg-slate-950">
              ■ SYS_LOG_EDGE_PROCESSOR
            </span>
            {systemLogs.map((log, index) => (
              <div key={index} className="leading-relaxed">
                <span className="text-slate-500">[{log.time}]</span>{" "}
                <span className={
                  log.type === "success" ? "text-emerald-400" : 
                  log.type === "warn" ? "text-rose-400" : "text-sky-300"
                }>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sweep {
          0%, 100% { top: 10%; opacity: 0.2; }
          50% { top: 90%; opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
