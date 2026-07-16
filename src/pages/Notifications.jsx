import { Mail, Send } from "lucide-react";
import { Tabs } from "../components/ui/Tabs";
import EmailTemplates from "./EmailTemplates";
import EmailProviders from "./EmailProviders";

const TABS = [
  { key: "templates", label: "Email templates", icon: Mail },
  { key: "providers", label: "Email providers", icon: Send },
];

export default function Notifications() {
  return (
    <Tabs tabs={TABS} defaultTab="templates">
      {(active) => (
        <>
          {active === "templates" && <EmailTemplates />}
          {active === "providers" && <EmailProviders />}
        </>
      )}
    </Tabs>
  );
}
