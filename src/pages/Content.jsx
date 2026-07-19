import { Compass, PanelBottom, FileText, Palette } from "lucide-react";
import { Tabs } from "../components/ui/Tabs";
import { EmptyState } from "../components/ui/Table";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../lib/permissions";
import Navigation from "./Navigation";
import Footer from "./Footer";
import PagesList from "./PagesList";
import Themes from "./Themes";

const ALL_TABS = [
  { key: "navigation", label: "Navigation", icon: Compass, permission: "content.navigation" },
  { key: "footer", label: "Footer", icon: PanelBottom, permission: "content.footer" },
  { key: "pages", label: "Pages", icon: FileText, permission: "content.pages" },
  { key: "themes", label: "Themes", icon: Palette, permission: "content.themes" },
];

export default function Content() {
  const { user } = useAuth();
  const tabs = ALL_TABS.filter((t) => hasPermission(user, t.permission));

  if (tabs.length === 0) {
    return <EmptyState title="No access" description="You don't have access to any Content sections." />;
  }

  return (
    <Tabs tabs={tabs} defaultTab={tabs[0].key}>
      {(active) => (
        <>
          {active === "navigation" && <Navigation />}
          {active === "footer" && <Footer />}
          {active === "pages" && <PagesList />}
          {active === "themes" && <Themes />}
        </>
      )}
    </Tabs>
  );
}
