import { useAtomValue } from "jotai";
import { desktopTabAtom } from "@/atoms/desktopTabAtom";
import ManageWallet from "@/components/manage-wallet";
import SendTokens from "@/components/send-tokens";
import Balances from "@/components/balances";
import BackupWallet from "@/components/keystore-wallet";
import MobileNavbar from "@/components/mobile-navbar";
import RpcSettings from "@/components/rpc-settings";
import OfflineSettings from "@/components/offline-settings";
import ManageAddressBook from "@/components/manage-address-book";
import OutgoingActivity from "@/components/outgoing-activity";
import LocalDeviceBackup from "@/components/local-device-backup";

export default function App() {
  const desktopTab = useAtomValue(desktopTabAtom);

  return (
    <>
      <MobileNavbar />
      <div className="hidden lg:block w-full">
        {desktopTab === "home" && (
          <div className="grid lg:grid-cols-3 gap-4 w-full">
            <div className="flex flex-col gap-4">
              <ManageWallet />
            </div>
            <SendTokens />
            <div className="flex flex-col gap-4">
              <Balances />
            </div>
          </div>
        )}
        {desktopTab === "address-book" && (
          <div className="w-[760px] mx-auto">
            <ManageAddressBook />
          </div>
        )}
        {desktopTab === "activity" && (
          <div className="w-[760px] mx-auto">
            <OutgoingActivity />
          </div>
        )}
        {desktopTab === "backup" && (
          <div className="grid lg:grid-cols-2 gap-4 w-full">
            <BackupWallet />
            <LocalDeviceBackup />
          </div>
        )}
        {desktopTab === "settings" && (
          <div className="grid lg:grid-cols-2 gap-4 items-start">
            <div className="border-2 border-primary p-4">
              <RpcSettings />
            </div>
            <div className="border-2 border-primary p-4">
              <OfflineSettings />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
