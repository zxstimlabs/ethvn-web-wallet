import { useAtom } from "jotai";
import { walletsAtom } from "@/atoms/walletsAtom";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";
import type { UmKeystore } from "@/types/wallet";

const CURRENT_UM_VERSION = "0.0.1";
const CURRENT_META_TYPE = "password-keystore-seedphrase";

function needsMigration(wallet: UmKeystore): boolean {
  return (
    wallet.meta.umVersion !== CURRENT_UM_VERSION ||
    wallet.meta.type !== CURRENT_META_TYPE
  );
}

function migrateWallet(wallet: UmKeystore): UmKeystore {
  return {
    ...wallet,
    meta: {
      ...wallet.meta,
      type: CURRENT_META_TYPE,
      umVersion: CURRENT_UM_VERSION,
    },
  };
}

export default function MigrationWalletStorage() {
  const [wallets, setWallets] = useAtom(walletsAtom);

  const hasMismatch = wallets.some(needsMigration);

  if (!hasMismatch) return null;

  function handleMigrate() {
    setWallets((prev) => prev.map((w) => (needsMigration(w) ? migrateWallet(w) : w)));
  }

  const staleCount = wallets.filter(needsMigration).length;

  return (
    <div className="flex flex-col gap-2 border-2 border-yellow-500 bg-yellow-500/10 p-3">
      <div className="flex flex-row gap-2 items-center text-yellow-600 dark:text-yellow-400">
        <TriangleAlert className="w-4 h-4 shrink-0" />
        <p className="text-xs font-medium">
          {staleCount} ví đang dùng định dạng lưu trữ cũ (thiếu <code>umVersion</code>).
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Nhấn bên dưới để chuyển sang định dạng hiện tại ({CURRENT_UM_VERSION}). Khóa không bị thay đổi — chỉ cập nhật metadata.
      </p>
      <Button
        type="button"
        className="rounded-none hover:cursor-pointer w-fit border-yellow-500 text-yellow-600 dark:text-yellow-400"
        variant="outline"
        onClick={handleMigrate}
      >
        Chuyển đổi {staleCount} ví
      </Button>
    </div>
  );
}
