import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderOpen } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";

interface FilePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  type: "file" | "directory";
  label: string;
  fileFilters?: { name: string; extensions: string[] }[];
  placeholder?: string;
}

export function FilePickerInput({
  value,
  onChange,
  type,
  fileFilters,
  placeholder,
}: FilePickerInputProps) {
  const handleBrowse = async () => {
    try {
      if (type === "directory") {
        const selected = await open({ directory: true });
        if (selected) onChange(selected as string);
      } else {
        const filters = fileFilters?.map((f) => ({
          name: f.name,
          extensions: f.extensions,
        }));
        const selected = await open({
          multiple: false,
          filters: filters || undefined,
        });
        if (selected) onChange(selected as string);
      }
    } catch (err) {
      console.error("文件选择失败:", err);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || (type === "directory" ? "选择目录..." : "选择文件...")}
        className="flex-1 text-xs h-8"
      />
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2.5 shrink-0"
        onClick={handleBrowse}
        type="button"
      >
        <FolderOpen className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
