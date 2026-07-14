import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, adjustUserCredits } from "../api/users";
import { runUserAction } from "../api/admin";
import { Card } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Input, Textarea } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";

export default function Users() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [adjustTarget, setAdjustTarget] = useState(null);
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", q],
    queryFn: () => fetchUsers(q),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }) => runUserAction(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast("Updated", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Users</h1>
          <p className="text-sm text-text-muted">Search accounts and adjust credit balances manually.</p>
        </div>
        <Input
          placeholder="Search by name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-64"
        />
      </div>

      <Card>
        {isLoading ? (
          <div className="p-5 text-text-muted">Loading…</div>
        ) : users.length === 0 ? (
          <EmptyState title="No users found" description="Try a different search." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Credits</Th>
                <Th>Status</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {users.map((u) => (
                <Tr key={u.id}>
                  <Td className="font-medium">{u.name}</Td>
                  <Td className="text-text-muted">{u.email}</Td>
                  <Td>
                    <Badge tone={u.role === "superadmin" ? "primary" : "neutral"}>{u.role}</Badge>
                  </Td>
                  <Td>{u.credits}</Td>
                  <Td>{u.isLocked && <Badge tone="danger">Locked</Badge>}</Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      {u.isLocked && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => actionMutation.mutate({ id: u.id, action: "unlock" })}
                          disabled={actionMutation.isPending}
                        >
                          Unlock
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => actionMutation.mutate({ id: u.id, action: u.role === "superadmin" ? "demote" : "promote" })}
                        disabled={actionMutation.isPending}
                      >
                        {u.role === "superadmin" ? "Demote" : "Promote"}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setAdjustTarget(u)}>
                        Adjust credits
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {adjustTarget && <AdjustCreditsModal user={adjustTarget} onClose={() => setAdjustTarget(null)} />}
    </div>
  );
}

function AdjustCreditsModal({ user, onClose }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () => adjustUserCredits(user.id, { amount: Number(amount), reason }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast(`Balance updated to ${data.credits} credits`, "success");
      onClose();
    },
    onError: (err) => toast(err.message, "error"),
  });

  const parsedAmount = Number(amount);
  const isValid = amount !== "" && Number.isInteger(parsedAmount) && parsedAmount !== 0;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Adjust credits — ${user.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!isValid || mutation.isPending}>
            Apply
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">
          Current balance: <strong className="text-text">{user.credits} credits</strong>
        </p>
        <Input
          label="Amount"
          type="number"
          placeholder="e.g. 50 or -20"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <p className="text-xs text-text-muted">Positive adds credits, negative subtracts (floored at 0).</p>
        <Textarea
          label="Reason (optional, kept in the audit log)"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Modal>
  );
}
