import { create } from "zustand";

export interface DeviceInfo {
  id: string;
  brand: string;
  model: string;
  android_version: string;
  api_level: string;
  connection_type: string;
  mode: string;
}

interface DeviceStore {
  devices: DeviceInfo[];
  selectedDeviceId: string | null;
  setDevices: (devices: DeviceInfo[]) => void;
  selectDevice: (id: string | null) => void;
}

export const useDeviceStore = create<DeviceStore>((set, get) => ({
  devices: [],
  selectedDeviceId: null,
  setDevices: (devices) => {
    const current = get();
    set({ devices });
    if (devices.length === 1 && current.selectedDeviceId !== devices[0].id) {
      set({ selectedDeviceId: devices[0].id });
    }
    if (
      current.selectedDeviceId &&
      !devices.find((d) => d.id === current.selectedDeviceId)
    ) {
      set({ selectedDeviceId: devices.length > 0 ? devices[0].id : null });
    }
  },
  selectDevice: (id) => set({ selectedDeviceId: id }),
}));
