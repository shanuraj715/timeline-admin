import { Compass, PanelBottom, FileText, Palette, LayoutTemplate, Sparkle } from "lucide-react";
import { Tabs } from "../components/ui/Tabs";
import { EmptyState } from "../components/ui/Table";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../lib/permissions";
import Navigation from "./Navigation";
import Footer from "./Footer";
import PagesList from "./PagesList";
import Homepage from "./Homepage";
import Branding from "./Branding";
import Themes from "./Themes";

const ALL_TABS = [
  { key: "navigation", label: "Navigation", icon: Compass, permission: "content.navigation" },
  { key: "footer", label: "Footer", icon: PanelBottom, permission: "content.footer" },
  { key: "pages", label: "Pages", icon: FileText, permission: "content.pages" },
  { key: "homepage", label: "Homepage", icon: LayoutTemplate, permission: "content.homepage" },
  { key: "branding", label: "Branding", icon: Sparkle, permission: "content.branding" },
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
          {active === "homepage" && <Homepage />}
          {active === "branding" && <Branding />}
          {active === "themes" && <Themes />}
        </>
      )}
    </Tabs>
  );
}
