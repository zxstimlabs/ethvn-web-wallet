import { useState } from "react";
import { useAtom } from "jotai";
import { settingsAtom } from "@/atoms/settingsAtom";
import type { RpcEntry } from "@/types/setting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mainnet } from "wagmi/chains";
import { Save, Trash2, Check } from "lucide-react";
import { validateUrl } from "@/lib/settings";

const DEFAULT_RPC_URL = import.meta.env.VITE_MAINNET_RPC_URL as string;

export default function RpcSettings() {
  const [settings, setSettings] = useAtom(settingsAtom);

  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  function handleAdd() {
    const err = validateUrl(newUrl);
    if (err) { setAddError(err); return; }
    const entry: RpcEntry = {
      id: crypto.randomUUID(),
      name: newName.trim() || undefined,
      url: newUrl.trim(),
      chainId: mainnet.id,
    };
    setSettings((prev) => ({ ...prev, rpcList: [...prev.rpcList, entry] }));
    setNewName("");
    setNewUrl("");
    setAddError(null);
  }

  function handleDelete(id: string) {
    setSettings((prev) => ({
      ...prev,
      rpcList: prev.rpcList.filter((r) => r.id !== id),
      activeRpc: prev.activeRpc?.id === id ? null : prev.activeRpc,
    }));
    window.location.reload();
  }

  function handleSelect(entry: RpcEntry) {
    setSettings((prev) => ({ ...prev, activeRpc: entry }));
    window.location.reload();
  }

  function handleResetToDefault() {
    setSettings((prev) => ({ ...prev, activeRpc: null }));
    window.location.reload();
  }

  const activeUrl = settings.activeRpc?.url ?? DEFAULT_RPC_URL;
  const isUsingCustomRpc = !!settings.activeRpc;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Active RPC ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Điểm cuối RPC</h2>

        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Đang dùng</p>
          <div className="flex flex-row items-center gap-2">
            <span className={`text-xs px-1.5 py-0.5 border ${
              isUsingCustomRpc
                ? "border-primary text-primary"
                : "border-muted-foreground text-muted-foreground"
            }`}>
              {isUsingCustomRpc ? settings.activeRpc?.name ?? "tùy chỉnh" : "mặc định"}
            </span>
            <code className="text-xs font-mono text-muted-foreground break-all">
              {activeUrl || "—"}
            </code>
          </div>
        </div>

        {isUsingCustomRpc && (
          <Button
            type="button"
            variant="outline"
            className="rounded-none hover:cursor-pointer w-fit"
            onClick={handleResetToDefault}
          >
            Đặt lại mặc định
          </Button>
        )}
      </div>

      <div className="border-t border-border" />

      {/* ── RPC List ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">RPC đã lưu</h2>

        {settings.rpcList.length === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa lưu RPC tùy chỉnh nào.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {settings.rpcList.map((entry) => {
              const isActive = settings.activeRpc?.id === entry.id;
              return (
                <div
                  key={entry.id}
                  className={`flex flex-row items-center justify-between gap-2 border p-2 ${
                    isActive ? "border-primary" : "border-border"
                  }`}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    {entry.name && (
                      <p className="text-xs font-medium truncate">{entry.name}</p>
                    )}
                    <code className="text-xs text-muted-foreground font-mono truncate">
                      {entry.url}
                    </code>
                  </div>
                  <div className="flex flex-row gap-1 shrink-0">
                    <Button
                      type="button"
                      variant={isActive ? "default" : "outline"}
                      size="icon"
                      className="rounded-none hover:cursor-pointer w-7 h-7"
                      onClick={() => handleSelect(entry)}
                      title={isActive ? "Đang dùng" : "Đặt làm RPC đang dùng"}
                      disabled={isActive}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-none hover:cursor-pointer hover:text-destructive w-7 h-7"
                      onClick={() => handleDelete(entry.id)}
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border" />

      {/* ── Add RPC ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Thêm RPC</h2>
        <Input
          className="rounded-none text-base"
          placeholder="Tên (không bắt buộc, vd: Alchemy)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Input
          className="rounded-none text-base"
          placeholder="https://..."
          value={newUrl}
          onChange={(e) => { setNewUrl(e.target.value); setAddError(null); }}
          type="url"
        />
        {addError && <p className="text-xs text-destructive">{addError}</p>}
        <Button
          type="button"
          className="rounded-none hover:cursor-pointer w-fit"
          onClick={handleAdd}
        >
          <Save className="w-3.5 h-3.5" />
          Lưu
        </Button>
      </div>

    </div>
  );
}
