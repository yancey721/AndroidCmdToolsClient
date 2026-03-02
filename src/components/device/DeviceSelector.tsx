import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeviceStore } from "@/stores/deviceStore";
import { Smartphone, Wifi, Usb, AlertCircle } from "lucide-react";

export function DeviceSelector() {
  const { devices, selectedDeviceId, selectDevice } = useDeviceStore();

  if (devices.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
        <span>未连接设备</span>
      </div>
    );
  }

  const formatDevice = (d: typeof devices[0]) => {
    const name = d.brand && d.model ? `${d.brand} ${d.model}` : d.id;
    const version = d.android_version ? ` (Android ${d.android_version})` : "";
    return `${name}${version}`;
  };

  return (
    <Select value={selectedDeviceId || undefined} onValueChange={selectDevice}>
      <SelectTrigger className="h-7 w-auto min-w-[180px] max-w-[280px] text-xs gap-1.5 border-border/50">
        <Smartphone className="h-3.5 w-3.5 shrink-0" />
        <SelectValue placeholder="选择设备" />
      </SelectTrigger>
      <SelectContent>
        {devices.map((device) => (
          <SelectItem key={device.id} value={device.id}>
            <div className="flex items-center gap-2">
              {device.connection_type === "tcp" ? (
                <Wifi className="h-3 w-3 text-blue-400" />
              ) : (
                <Usb className="h-3 w-3 text-green-400" />
              )}
              <span>{formatDevice(device)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
