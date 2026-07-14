import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRecentOrders } from "../api/billing";
import { Card } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";

const STATUS_TONE = { paid: "success", created: "neutral", failed: "danger", cancelled: "warning" };

function formatPrice(paise, currency) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(paise / 100);
}

export default function Orders() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchRecentOrders(200),
  });
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(
    () => (statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter)),
    [orders, statusFilter]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Orders</h1>
          <p className="text-sm text-text-muted">Credit purchase transactions across all users.</p>
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="created">Created</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-5 text-text-muted">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No orders found" description="Orders will show up here once users start buying credits." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>User</Th>
                <Th>Plan</Th>
                <Th>Gateway</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((order) => (
                <Tr key={order.id}>
                  <Td>
                    <div className="font-medium">{order.user?.name || "—"}</div>
                    <div className="text-xs text-text-muted">{order.user?.email}</div>
                  </Td>
                  <Td>{order.plan ? `${order.plan.name} (${order.plan.credits} credits)` : "—"}</Td>
                  <Td className="capitalize text-text-muted">{order.gatewayProvider}</Td>
                  <Td>{formatPrice(order.amount, order.currency)}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[order.status] || "neutral"}>{order.status}</Badge>
                  </Td>
                  <Td className="text-text-muted">{new Date(order.createdAt).toLocaleString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
