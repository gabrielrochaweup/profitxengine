import { Signal, Wifi, BatteryFull } from "lucide-react";

export function StatusBar({ time, dark = true }: { time: string; dark?: boolean }) {
  const color = dark ? "text-white" : "text-black";
  return (
    <div className={`flex h-11 items-center justify-between px-6 pt-1 text-[15px] font-semibold ${color}`}>
      <span>{time}</span>
      <div className="flex items-center gap-1.5">
        <Signal size={15} />
        <Wifi size={15} />
        <BatteryFull size={17} />
      </div>
    </div>
  );
}
