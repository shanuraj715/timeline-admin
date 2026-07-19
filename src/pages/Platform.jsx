import {
  Users as UsersIcon,
  GalleryHorizontalEnd,
  ShieldAlert,
  Flag,
  SlidersHorizontal,
  Database,
  KeyRound,
  Activity,
} from "lucide-react";
import { Tabs } from "../components/ui/Tabs";
import { EmptyState } from "../components/ui/Table";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../lib/permissions";
import Users from "./Users";
import Timelines from "./Timelines";
import SecurityLog from "./SecurityLog";
import FeatureFlags from "./FeatureFlags";
import Settings from "./Settings";
import Storage from "./Storage";
import AdminAccounts from "./AdminAccounts";
import VideoQueue from "./VideoQueue";

const ALL_TABS = [
  { key: "users", label: "Users", icon: UsersIcon, permission: "platform.users" },
  { key: "timelines", label: "Timelines", icon: GalleryHorizontalEnd, permission: "platform.timelines" },
  { key: "storage", label: "Storage", icon: Database, permission: "platform.storage" },
  { key: "system", label: "System health", icon: Activity, permission: "platform.system" },
  { key: "security", label: "Security log", icon: ShieldAlert, permission: "platform.security" },
  { key: "flags", label: "Feature flags", icon: Flag, permission: "platform.flags" },
  { key: "settings", label: "Settings", icon: SlidersHorizontal, permission: "platform.settings" },
  { key: "admins", label: "Admins", icon: KeyRound, permission: "platform.admins" },
];

export default function Platform() {
  const { user } = useAuth();
  const tabs = ALL_TABS.filter((t) => hasPermission(user, t.permission));

  if (tabs.length === 0) {
    return <EmptyState title="No access" description="You don't have access to any Platform sections." />;
  }

  return (
    <Tabs tabs={tabs} defaultTab={tabs[0].key}>
      {(active) => (
        <>
          {active === "users" && <Users />}
          {active === "timelines" && <Timelines />}
          {active === "storage" && <Storage />}
          {active === "system" && <VideoQueue />}
          {active === "security" && <SecurityLog />}
          {active === "flags" && <FeatureFlags />}
          {active === "settings" && <Settings />}
          {active === "admins" && <AdminAccounts />}
        </>
      )}
    </Tabs>
  );
}
