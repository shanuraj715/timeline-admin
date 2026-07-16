import { Users as UsersIcon, GalleryHorizontalEnd, ShieldAlert, Flag, SlidersHorizontal, Database } from "lucide-react";
import { Tabs } from "../components/ui/Tabs";
import Users from "./Users";
import Timelines from "./Timelines";
import SecurityLog from "./SecurityLog";
import FeatureFlags from "./FeatureFlags";
import Settings from "./Settings";
import Storage from "./Storage";

const TABS = [
  { key: "users", label: "Users", icon: UsersIcon },
  { key: "timelines", label: "Timelines", icon: GalleryHorizontalEnd },
  { key: "storage", label: "Storage", icon: Database },
  { key: "security", label: "Security log", icon: ShieldAlert },
  { key: "flags", label: "Feature flags", icon: Flag },
  { key: "settings", label: "Settings", icon: SlidersHorizontal },
];

export default function Platform() {
  return (
    <Tabs tabs={TABS} defaultTab="users">
      {(active) => (
        <>
          {active === "users" && <Users />}
          {active === "timelines" && <Timelines />}
          {active === "storage" && <Storage />}
          {active === "security" && <SecurityLog />}
          {active === "flags" && <FeatureFlags />}
          {active === "settings" && <Settings />}
        </>
      )}
    </Tabs>
  );
}
