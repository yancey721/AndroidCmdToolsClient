import { Terminal } from "lucide-react";
import { DeviceSelector } from "@/components/device/DeviceSelector";
import { EnvIndicator } from "@/components/common/EnvIndicator";
import { useEnvironmentCheck } from "@/hooks/useEnvironmentCheck";
import { Separator } from "@/components/ui/separator";

export function TitleBar() {
  const { status } = useEnvironmentCheck();

  return (
    <div
      className="h-12 flex items-center justify-between px-4 bg-background border-b border-border select-none"
      data-tauri-drag-region
    >
      <div className="flex items-center gap-2" data-tauri-drag-region>
        <Terminal className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">AndroidCmdTools</span>
      </div>
      <div className="flex items-center gap-3">
        <DeviceSelector />
        {status && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2.5">
              <EnvIndicator name="adb" available={status.adb} version={status.adb_version} />
              <EnvIndicator name="java" available={status.java} version={status.java_version} />
              <EnvIndicator name="git" available={status.git} version={status.git_version} />
              <EnvIndicator name="fastboot" available={status.fastboot} version={status.fastboot_version} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
