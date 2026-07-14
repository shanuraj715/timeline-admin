import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon } from "../api/coupons";
import { fetchPlans } from "../api/billing";
import { Card, CardBody } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Input, Select, Checkbox } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Switch } from "../components/ui/Switch";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";

const EMPTY_COUPON = {
  code: "",
  type: "percentage",
  value: 10,
  applicablePlanIds: [],
  isActive: true,
  expiresAt: "",
  maxRedemptions: "",
};

function describeValue(coupon) {
  return coupon.type === "percentage" ? `${coupon.value}% off` : `₹${(coupon.value / 100).toFixed(2)} off`;
}

export default function Coupons() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: coupons = [], isLoading } = useQuery({ queryKey: ["coupons"], queryFn: fetchCoupons });
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: fetchPlans });

  const [modalCoupon, setModalCoupon] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["coupons"] });
  }

  const saveMutation = useMutation({
    mutationFn: (coupon) => {
      const payload = {
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
        applicablePlanIds: coupon.applicablePlanIds,
        isActive: coupon.isActive,
        expiresAt: coupon.expiresAt || null,
        maxRedemptions: coupon.maxRedemptions ? Number(coupon.maxRedemptions) : null,
      };
      return coupon.id ? updateCoupon(coupon.id, payload) : createCoupon(payload);
    },
    onSuccess: () => {
      invalidate();
      setModalCoupon(null);
      toast("Coupon saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCoupon(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast("Coupon deleted", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateCoupon(id, { isActive }),
    onSuccess: invalidate,
    onError: (err) => toast(err.message, "error"),
  });

  const planNameById = new Map(plans.map((p) => [p._id, p.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Coupons</h1>
          <p className="text-sm text-text-muted">Discount codes for the pricing page — fixed amount or percentage.</p>
        </div>
        <Button onClick={() => setModalCoupon({ ...EMPTY_COUPON })}>
          <Plus size={16} /> Add coupon
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <CardBody>Loading…</CardBody>
        ) : coupons.length === 0 ? (
          <EmptyState title="No coupons yet" description="Add your first coupon." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Code</Th>
                <Th>Discount</Th>
                <Th>Plans</Th>
                <Th>Redemptions</Th>
                <Th>Expires</Th>
                <Th>Active</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {coupons.map((coupon) => (
                <Tr key={coupon.id}>
                  <Td className="font-mono font-medium">{coupon.code}</Td>
                  <Td>{describeValue(coupon)}</Td>
                  <Td className="text-text-muted">
                    {coupon.applicablePlanIds.length === 0 ? (
                      <Badge tone="neutral">All plans</Badge>
                    ) : (
                      coupon.applicablePlanIds.map((id) => planNameById.get(id) || id).join(", ")
                    )}
                  </Td>
                  <Td className="text-text-muted">
                    {coupon.redemptionCount}
                    {coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ""}
                  </Td>
                  <Td className="text-text-muted">
                    {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "Never"}
                  </Td>
                  <Td>
                    <Switch checked={coupon.isActive} onChange={(isActive) => toggleMutation.mutate({ id: coupon.id, isActive })} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setModalCoupon({
                            ...coupon,
                            expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
                            maxRedemptions: coupon.maxRedemptions ?? "",
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteTarget(coupon)}>
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

      {modalCoupon && (
        <CouponModal
          coupon={modalCoupon}
          plans={plans}
          onClose={() => setModalCoupon(null)}
          onSave={(data) => saveMutation.mutate(data)}
          saving={saveMutation.isPending}
        />
      )}

      {deleteTarget && (
        <Modal
          open
          onClose={() => setDeleteTarget(null)}
          title="Delete coupon"
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
            Delete "<strong>{deleteTarget.code}</strong>"? This can't be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}

function CouponModal({ coupon, plans, onClose, onSave, saving }) {
  const [form, setForm] = useState({ ...coupon });

  function togglePlan(planId) {
    setForm((f) => ({
      ...f,
      applicablePlanIds: f.applicablePlanIds.includes(planId)
        ? f.applicablePlanIds.filter((id) => id !== planId)
        : [...f.applicablePlanIds, planId],
    }));
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={coupon.id ? "Edit coupon" : "Add coupon"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)} disabled={saving || !form.code || !form.value}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Code"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          placeholder="SAVE20"
        />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </Select>
          <Input
            label={form.type === "percentage" ? "Value (%)" : "Value (paise)"}
            type="number"
            min={1}
            max={form.type === "percentage" ? 100 : undefined}
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-text">Applicable plans</span>
          <p className="mb-2 text-xs text-text-muted">Leave all unchecked to apply this coupon to every plan.</p>
          <div className="flex flex-col gap-1.5">
            {plans.map((plan) => (
              <Checkbox
                key={plan._id}
                label={plan.name}
                checked={form.applicablePlanIds.includes(plan._id)}
                onChange={() => togglePlan(plan._id)}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Expires (optional)"
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          />
          <Input
            label="Max redemptions (optional)"
            type="number"
            min={1}
            value={form.maxRedemptions}
            onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
            placeholder="Unlimited"
          />
        </div>

        <Checkbox
          label="Active"
          checked={form.isActive}
          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
        />
      </div>
    </Modal>
  );
}
