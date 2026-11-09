import { useAtom } from "jotai";
import { settingsAtom } from "@/atoms/settingsAtom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";

export default function OfflineSettings() {
  const [settings, setSettings] = useAtom(settingsAtom);

  function handleOfflineToggle(checked: boolean) {
    setSettings((prev) => ({ ...prev, offlineMode: checked }));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold">Chế độ ngoại tuyến</h2>
        <p className="text-xs text-muted-foreground">
          Tắt mọi truy vấn mạng — số dư, giá gas, tra cứu ENS.
          Dùng chế độ này để ký giao dịch mà không phát lên mạng.
        </p>
      </div>

      <div className="flex flex-row items-center gap-3">
        <Switch
          checked={settings.offlineMode}
          onCheckedChange={handleOfflineToggle}
          className="rounded-none **:data-[slot=switch-thumb]:rounded-none"
        />
        <Label>
          {settings.offlineMode ? (
            <span className="text-amber-500">Ngoại tuyến — đã tắt truy vấn mạng</span>
          ) : (
            <span className="text-muted-foreground">Trực tuyến</span>
          )}
        </Label>
      </div>

      {settings.offlineMode && (
        <div className="flex flex-row items-start gap-2 border border-amber-500/40 bg-amber-500/5 p-2 text-xs text-amber-500">
          <RefreshCw className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p>
            Mọi truy vấn số dư và mạng đã tạm dừng. Bạn vẫn có thể ký
            giao dịch — hãy tắt chế độ ngoại tuyến trước khi phát giao dịch.
          </p>
        </div>
      )}
    </div>
  );
}
