import { Tag, Ticket, Wallet, Receipt, Coins } from "lucide-react";
import { Tabs } from "../components/ui/Tabs";
import Pricing from "./Pricing";
import Coupons from "./Coupons";
import PaymentGateways from "./PaymentGateways";
import Orders from "./Orders";
import Currencies from "./Currencies";

const TABS = [
  { key: "pricing", label: "Pricing plans", icon: Tag },
  { key: "currencies", label: "Currencies", icon: Coins },
  { key: "coupons", label: "Coupons", icon: Ticket },
  { key: "gateways", label: "Payment gateways", icon: Wallet },
  { key: "orders", label: "Orders", icon: Receipt },
];

export default function Commerce() {
  return (
    <Tabs tabs={TABS} defaultTab="pricing">
      {(active) => (
        <>
          {active === "pricing" && <Pricing />}
          {active === "currencies" && <Currencies />}
          {active === "coupons" && <Coupons />}
          {active === "gateways" && <PaymentGateways />}
          {active === "orders" && <Orders />}
        </>
      )}
    </Tabs>
  );
}
