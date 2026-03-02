import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect, useCallback } from "react";

export interface EnvironmentStatus {
  adb: boolean;
  java: boolean;
  git: boolean;
  fastboot: boolean;
  adb_version: string | null;
  java_version: string | null;
  git_version: string | null;
  fastboot_version: string | null;
}

export function useEnvironmentCheck() {
  const [status, setStatus] = useState<EnvironmentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<EnvironmentStatus>("check_environment");
      setStatus(result);
    } catch (err) {
      console.error("环境检查失败:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, refresh };
}
