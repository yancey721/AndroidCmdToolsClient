import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef } from "react";
import { DeviceInfo, useDeviceStore } from "@/stores/deviceStore";

export function useDeviceDetection(intervalMs = 3000) {
  const setDevices = useDeviceStore((s) => s.setDevices);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const detect = async () => {
      try {
        const devices = await invoke<DeviceInfo[]>("detect_devices");
        setDevices(devices);
      } catch (err) {
        console.error("设备检测失败:", err);
      }
    };

    detect();
    timerRef.current = setInterval(detect, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMs, setDevices]);
}
