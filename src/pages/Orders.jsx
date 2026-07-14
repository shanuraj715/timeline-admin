import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Undo2 } from "lucide-react";
import { fetchAdminOrders } from "../api/admin";
import { refundOrder } from "../api/billing";
import { Card } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";

const LIMIT = 20;
const STATUS_TONE = { paid: "success", created: "neutral", failed: "danger", cancelled: "warning", refunded: "warning" };

function formatPrice(paise, currency) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(paise / 100);
}

export default function Orders() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [refundTarget, setRefundTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", statusFilter, page],
    queryFn: () => fetchAdminOrders({ page, limit: LIMIT, status: statusFilter }),
  });
  const orders = data?.orders || [];

  const refundMutation = useMutation({
    mutationFn: (id) => refundOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setRefundTarget(null);
      toast("Order refunded", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Orders</h1>
          <p className="text-sm text-text-muted">Credit purchase transactions across all users.</p>
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-40"
        >
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="created">Created</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-5 text-text-muted">Loading…</div>
        ) : orders.length === 0 ? (
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
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {orders.map((order) => (
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
                  <Td>
                    {order.status === "paid" && (
                      <IconButton label="Refund order" icon={Undo2} onClick={() => setRefundTarget(order)} />
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        {data && <Pagination page={data.page} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>

      {refundTarget && (
        <Modal
          open
          onClose={() => setRefundTarget(null)}
          title="Refund order"
          footer={
            <>
              <Button variant="secondary" onClick={() => setRefundTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => refundMutation.mutate(refundTarget.id)}
                disabled={refundMutation.isPending}
              >
                Refund
              </Button>
            </>
          }
        >
          <p className="text-sm text-text">
            Refund {formatPrice(refundTarget.amount, refundTarget.currency)} to{" "}
            <strong>{refundTarget.user?.email || "this user"}</strong>? This deducts {refundTarget.credits} credits
            from their balance (down to a minimum of 0) and marks the order refunded. It doesn't call the payment
            gateway — settle the actual money movement there separately.
          </p>
        </Modal>
      )}
    </div>
  );
}
