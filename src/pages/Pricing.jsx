import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { fetchPlans, createPlan, updatePlan, deletePlan } from "../api/billing";
import { Card, CardBody } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Input, Textarea, Checkbox } from "../components/ui/Input";
import { Switch } from "../components/ui/Switch";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";

const EMPTY_PLAN = {
  name: "",
  slug: "",
  description: "",
  credits: 100,
  priceInPaise: 9900,
  currency: "INR",
  isActive: true,
  isFeatured: false,
};

function formatPrice(paise, currency) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(paise / 100);
}

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function Pricing() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: plans = [], isLoading } = useQuery({ queryKey: ["plans"], queryFn: fetchPlans });

  const [modalPlan, setModalPlan] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["plans"] });
  }

  const saveMutation = useMutation({
    mutationFn: (plan) => (plan._id ? updatePlan(plan._id, plan) : createPlan(plan)),
    onSuccess: () => {
      invalidate();
      setModalPlan(null);
      toast("Plan saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePlan(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast("Plan deleted", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => updatePlan(id, { isActive }),
    onSuccess: invalidate,
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Pricing plans</h1>
          <p className="text-sm text-text-muted">Credit packs users can buy on the public pricing page.</p>
        </div>
        <Button onClick={() => setModalPlan({ ...EMPTY_PLAN })}>
          <Plus size={16} /> Add plan
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <CardBody>Loading…</CardBody>
        ) : plans.length === 0 ? (
          <EmptyState title="No plans yet" description="Add your first pricing plan." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Credits</Th>
                <Th>Price</Th>
                <Th>Featured</Th>
                <Th>Active</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {plans.map((plan) => (
                <Tr key={plan._id}>
                  <Td className="font-medium">{plan.name}</Td>
                  <Td>{plan.credits}</Td>
                  <Td>{formatPrice(plan.priceInPaise, plan.currency)}</Td>
                  <Td>{plan.isFeatured && <Badge tone="primary">Featured</Badge>}</Td>
                  <Td>
                    <Switch checked={plan.isActive} onChange={(isActive) => toggleMutation.mutate({ id: plan._id, isActive })} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <IconButton label="Edit plan" icon={Pencil} onClick={() => setModalPlan(plan)} />
                      <IconButton label="Delete plan" icon={Trash2} variant="danger" onClick={() => setDeleteTarget(plan)} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {modalPlan && (
        <PlanModal
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
          title="Delete plan"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => deleteMutation.mutate(deleteTarget._id)} disabled={deleteMutation.isPending}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-text">
            Delete "<strong>{deleteTarget.name}</strong>"? This can't be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}

function PlanModal({ plan, onClose, onSave, saving }) {
  const [form, setForm] = useState({ ...plan });
  const [slugTouched, setSlugTouched] = useState(Boolean(plan._id));

  function handleNameChange(e) {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={plan._id ? "Edit plan" : "Add plan"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)} disabled={saving || !form.name || !form.slug}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Name" value={form.name} onChange={handleNameChange} />
        <Input
          label="Slug"
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setForm({ ...form, slug: e.target.value });
          }}
        />
        <Textarea
          label="Description"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Credits"
            type="number"
            min={1}
            value={form.credits}
            onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
          />
          <Input
            label="Price (in paise)"
            type="number"
            min={0}
            value={form.priceInPaise}
            onChange={(e) => setForm({ ...form, priceInPaise: Number(e.target.value) })}
          />
        </div>
        <p className="-mt-2 text-xs text-text-muted">
          {form.priceInPaise ? formatPrice(form.priceInPaise, form.currency || "INR") : "—"}
        </p>
        <div className="flex gap-4">
          <Checkbox
            label="Active"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          <Checkbox
            label="Featured"
            checked={form.isFeatured}
            onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
          />
        </div>
      </div>
    </Modal>
  );
}
