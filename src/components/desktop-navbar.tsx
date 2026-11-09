import { useAtom } from "jotai";
import { desktopTabAtom, type DesktopTab } from "@/atoms/desktopTabAtom";

const TABS: { id: DesktopTab; label: string }[] = [
  { id: "home", label: "Trang chủ" },
  { id: "address-book", label: "Danh bạ" },
  { id: "activity", label: "Hoạt động" },
  { id: "backup", label: "Sao lưu" },
  { id: "settings", label: "Cài đặt" },
];

export default function DesktopNavbar() {
  const [activeTab, setActiveTab] = useAtom(desktopTabAtom);

  return (
    <nav className="hidden lg:flex flex-row border-2 border-primary">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-1 text-sm font-medium hover:cursor-pointer transition-colors ${
            activeTab === tab.id
              ? "bg-primary text-secondary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
