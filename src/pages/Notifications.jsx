import { Mail, Send } from "lucide-react";
import { Tabs } from "../components/ui/Tabs";
import { EmptyState } from "../components/ui/Table";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../lib/permissions";
import EmailTemplates from "./EmailTemplates";
import EmailProviders from "./EmailProviders";

const ALL_TABS = [
  { key: "templates", label: "Email templates", icon: Mail, permission: "notifications.templates" },
  { key: "providers", label: "Email providers", icon: Send, permission: "notifications.providers" },
];

export default function Notifications() {
  const { user } = useAuth();
  const tabs = ALL_TABS.filter((t) => hasPermission(user, t.permission));

  if (tabs.length === 0) {
    return <EmptyState title="No access" description="You don't have access to any Notifications sections." />;
  }

  return (
    <Tabs tabs={tabs} defaultTab={tabs[0].key}>
      {(active) => (
        <>
          {active === "templates" && <EmailTemplates />}
          {active === "providers" && <EmailProviders />}
        </>
      )}
    </Tabs>
  );
}
