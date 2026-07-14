import { useQuery } from "@tanstack/react-query";
import { fetchSummary, fetchRevenueOverTime, fetchSignupsOverTime } from "../api/analytics";
import { fetchRecentOrders } from "../api/billing";
import { StatTile } from "../components/StatTile";
import { TimeSeriesChart } from "../components/TimeSeriesChart";
import { Card, CardHeader } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { formatCompactNumber, formatCurrency } from "../lib/format";

const STATUS_TONE = { paid: "success", created: "neutral", failed: "danger", cancelled: "warning" };

export default function Dashboard() {
  const { data: summary } = useQuery({ queryKey: ["analytics", "summary"], queryFn: fetchSummary });
  const { data: revenue = [] } = useQuery({
    queryKey: ["analytics", "revenue", 30],
    queryFn: () => fetchRevenueOverTime(30),
  });
  const { data: signups = [] } = useQuery({
    queryKey: ["analytics", "signups", 30],
    queryFn: () => fetchSignupsOverTime(30),
  });
  const { data: recentOrders = [] } = useQuery({ queryKey: ["orders", "recent"], queryFn: () => fetchRecentOrders(8) });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text">Dashboard</h1>
        <p className="text-sm text-text-muted">Revenue, signups, and recent activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total revenue" value={summary ? formatCurrency(summary.totalRevenue) : "—"} />
        <StatTile label="Total orders" value={summary ? formatCompactNumber(summary.totalOrders) : "—"} />
        <StatTile label="Credits sold" value={summary ? formatCompactNumber(summary.totalCreditsSold) : "—"} />
        <StatTile
          label="Avg order value"
          value={summary ? formatCurrency(summary.avgOrderValue) : "—"}
        />
        <StatTile label="Total users" value={summary ? formatCompactNumber(summary.totalUsers) : "—"} />
        <StatTile
          label="New users (30d)"
          value={summary ? formatCompactNumber(summary.newUsersLast30Days) : "—"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Revenue" description="Last 30 days" />
          <div className="px-2 pb-4 pt-2">
            <TimeSeriesChart data={revenue} dataKey="revenue" valueFormatter={(v) => formatCurrency(v)} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Signups" description="Last 30 days" />
          <div className="px-2 pb-4 pt-2">
            <TimeSeriesChart data={signups} dataKey="count" valueFormatter={formatCompactNumber} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent orders" />
        {recentOrders.length === 0 ? (
          <EmptyState title="No orders yet" />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>User</Th>
                <Th>Plan</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {recentOrders.map((order) => (
                <Tr key={order.id}>
                  <Td>{order.user?.name || "—"}</Td>
                  <Td>{order.plan?.name || "—"}</Td>
                  <Td>{formatCurrency(order.amount, order.currency)}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[order.status] || "neutral"}>{order.status}</Badge>
                  </Td>
                  <Td className="text-text-muted">{new Date(order.createdAt).toLocaleDateString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
