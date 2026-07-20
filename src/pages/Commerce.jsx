import { Tag, Ticket, Wallet, Receipt, Coins, CircleDollarSign } from "lucide-react";
import { Tabs } from "../components/ui/Tabs";
import { EmptyState } from "../components/ui/Table";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../lib/permissions";
import Pricing from "./Pricing";
import CreditCosts from "./CreditCosts";
import Coupons from "./Coupons";
import PaymentGateways from "./PaymentGateways";
import Orders from "./Orders";
import Currencies from "./Currencies";

const ALL_TABS = [
  { key: "pricing", label: "Pricing plans", icon: Tag, permission: "commerce.pricing" },
  { key: "creditCosts", label: "Credit costs", icon: CircleDollarSign, permission: "commerce.creditCosts" },
  { key: "currencies", label: "Currencies", icon: Coins, permission: "commerce.currencies" },
  { key: "coupons", label: "Coupons", icon: Ticket, permission: "commerce.coupons" },
  { key: "gateways", label: "Payment gateways", icon: Wallet, permission: "commerce.gateways" },
  { key: "orders", label: "Orders", icon: Receipt, permission: "commerce.orders" },
];

export default function Commerce() {
  const { user } = useAuth();
  const tabs = ALL_TABS.filter((t) => hasPermission(user, t.permission));

  if (tabs.length === 0) {
    return <EmptyState title="No access" description="You don't have access to any Commerce sections." />;
  }

  return (
    <Tabs tabs={tabs} defaultTab={tabs[0].key}>
      {(active) => (
        <>
          {active === "pricing" && <Pricing />}
          {active === "creditCosts" && <CreditCosts />}
          {active === "currencies" && <Currencies />}
          {active === "coupons" && <Coupons />}
          {active === "gateways" && <PaymentGateways />}
          {active === "orders" && <Orders />}
        </>
      )}
    </Tabs>
  );
}
