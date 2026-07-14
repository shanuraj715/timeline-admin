import { Tag, Ticket, Wallet, Receipt } from "lucide-react";
import { Tabs } from "../components/ui/Tabs";
import Pricing from "./Pricing";
import Coupons from "./Coupons";
import PaymentGateways from "./PaymentGateways";
import Orders from "./Orders";

const TABS = [
  { key: "pricing", label: "Pricing plans", icon: Tag },
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
          {active === "coupons" && <Coupons />}
          {active === "gateways" && <PaymentGateways />}
          {active === "orders" && <Orders />}
        </>
      )}
    </Tabs>
  );
}
