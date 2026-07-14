import { Compass, PanelBottom, FileText, Palette } from "lucide-react";
import { Tabs } from "../components/ui/Tabs";
import Navigation from "./Navigation";
import Footer from "./Footer";
import PagesList from "./PagesList";
import Themes from "./Themes";

const TABS = [
  { key: "navigation", label: "Navigation", icon: Compass },
  { key: "footer", label: "Footer", icon: PanelBottom },
  { key: "pages", label: "Pages", icon: FileText },
  { key: "themes", label: "Themes", icon: Palette },
];

export default function Content() {
  return (
    <Tabs tabs={TABS} defaultTab="navigation">
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
