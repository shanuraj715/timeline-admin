import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { fetchStoragePlans, createStoragePlan, updateStoragePlan, deleteStoragePlan } from "../api/storagePlans";
import { Card, CardBody } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Switch } from "../components/ui/Switch";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";

const BYTES_PER_MB = 1024 * 1024;
const EMPTY_PLAN = { name: "", mb: 1024, priceCredits: 30, isActive: true, order: 0 };

function formatBytes(bytes) {
  const mb = bytes / BYTES_PER_MB;
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(0)} MB`;
}

export default function StoragePlans() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: plans = [], isLoading } = useQuery({ queryKey: ["storage-plans"], queryFn: fetchStoragePlans });

  const [modalPlan, setModalPlan] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["storage-plans"] });
  }

  const saveMutation = useMutation({
    mutationFn: (plan) => {
      const payload = {
        name: plan.name,
        bytes: Math.round(Number(plan.mb) * BYTES_PER_MB),
        priceCredits: Number(plan.priceCredits),
        isActive: plan.isActive,
        order: Number(plan.order) || 0,
      };
      return plan.id ? updateStoragePlan(plan.id, payload) : createStoragePlan(payload);
    },
    onSuccess: () => {
      invalidate();
      setModalPlan(null);
      toast("Storage plan saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteStoragePlan(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast("Storage plan deleted", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateStoragePlan(id, { isActive }),
    onSuccess: invalidate,
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Storage plans</h1>
          <p className="text-sm text-text-muted">
            Add-ons a timeline can buy with credits once it's used up its free storage.
          </p>
        </div>
        <Button onClick={() => setModalPlan({ ...EMPTY_PLAN })}>
          <Plus size={16} /> Add plan
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <CardBody>Loading…</CardBody>
        ) : plans.length === 0 ? (
          <EmptyState title="No storage plans yet" description="Add your first storage plan." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Grants</Th>
                <Th>Price</Th>
                <Th>Active</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {plans.map((plan) => (
                <Tr key={plan.id}>
                  <Td className="font-medium">{plan.name}</Td>
                  <Td>{formatBytes(plan.bytes)}</Td>
                  <Td>{plan.priceCredits} credits</Td>
                  <Td>
                    <Switch checked={plan.isActive} onChange={(isActive) => toggleMutation.mutate({ id: plan.id, isActive })} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setModalPlan({ ...plan, mb: plan.bytes / BYTES_PER_MB })}
                      >
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteTarget(plan)}>
                        Delete
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {modalPlan && (
        <StoragePlanModal
          plan={modalPlan}
          onClose={() => setModalPlan(null)}
          onSave={(data) => saveMutation.mutate(data)}
          saving={saveMutation.isPending}
        />
      )}

      {deleteTarget && (
        <Modal
          open
          onClose={() => setDeleteTarget(null)}
          title="Delete storage plan"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-text">
            Delete "<strong>{deleteTarget.name}</strong>"? This can't be undone, and fails if any timeline has already
            purchased it.
          </p>
        </Modal>
      )}
    </div>
  );
}

function StoragePlanModal({ plan, onClose, onSave, saving }) {
  const [form, setForm] = useState({ ...plan });

  return (
    <Modal
      open
      onClose={onClose}
      title={plan.id ? "Edit storage plan" : "Add storage plan"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)} disabled={saving || !form.name || !form.mb || !form.priceCredits}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="+1 GB" />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Grants (MB)"
            type="number"
            min={1}
            value={form.mb}
            onChange={(e) => setForm({ ...form, mb: e.target.value })}
          />
          <Input
            label="Price (credits)"
            type="number"
            min={1}
            value={form.priceCredits}
            onChange={(e) => setForm({ ...form, priceCredits: e.target.value })}
          />
        </div>
        <p className="-mt-2 text-xs text-text-muted">
          {form.mb ? formatBytes(Number(form.mb) * BYTES_PER_MB) : "—"}
        </p>
      </div>
    </Modal>
  );
}
