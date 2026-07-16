import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon } from "../api/coupons";
import { fetchPlans } from "../api/billing";
import { Card, CardBody } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
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
  accountAgeRule: { type: "none", relativeDays: "", startDate: "", endDate: "" },
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
        accountAgeRule: {
          type: coupon.accountAgeRule?.type || "none",
          relativeDays:
            coupon.accountAgeRule?.type === "relative" && coupon.accountAgeRule.relativeDays
              ? Number(coupon.accountAgeRule.relativeDays)
              : null,
          startDate: coupon.accountAgeRule?.type === "absolute" ? coupon.accountAgeRule.startDate || null : null,
          endDate: coupon.accountAgeRule?.type === "absolute" ? coupon.accountAgeRule.endDate || null : null,
        },
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
                <Th>Account age</Th>
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
                  <Td className="text-text-muted">
                    {coupon.accountAgeRule?.type === "relative" && (
                      <Badge tone="primary">Last {coupon.accountAgeRule.relativeDays}d</Badge>
                    )}
                    {coupon.accountAgeRule?.type === "absolute" && (
                      <Badge tone="primary">
                        {new Date(coupon.accountAgeRule.startDate).toLocaleDateString()} –{" "}
                        {new Date(coupon.accountAgeRule.endDate).toLocaleDateString()}
                      </Badge>
                    )}
                    {(!coupon.accountAgeRule || coupon.accountAgeRule.type === "none") && "—"}
                  </Td>
                  <Td>
                    <Switch checked={coupon.isActive} onChange={(isActive) => toggleMutation.mutate({ id: coupon.id, isActive })} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <IconButton
                        label="Edit coupon"
                        icon={Pencil}
                        onClick={() =>
                          setModalCoupon({
                            ...coupon,
                            expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
                            maxRedemptions: coupon.maxRedemptions ?? "",
                            accountAgeRule: {
                              type: coupon.accountAgeRule?.type || "none",
                              relativeDays: coupon.accountAgeRule?.relativeDays ?? "",
                              startDate: coupon.accountAgeRule?.startDate ? coupon.accountAgeRule.startDate.slice(0, 10) : "",
                              endDate: coupon.accountAgeRule?.endDate ? coupon.accountAgeRule.endDate.slice(0, 10) : "",
                            },
                          })
                        }
                      />
                      <IconButton label="Delete coupon" icon={Trash2} variant="danger" onClick={() => setDeleteTarget(coupon)} />
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

  function setAccountAgeRule(patch) {
    setForm((f) => ({ ...f, accountAgeRule: { ...f.accountAgeRule, ...patch } }));
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

        <div>
          <span className="mb-1.5 block text-sm font-medium text-text">Account age restriction</span>
          <p className="mb-2 text-xs text-text-muted">
            Only accounts created in this window can redeem the coupon. "Relative" stays evergreen (e.g. always the
            last 7 days); "Absolute" is a fixed campaign window.
          </p>
          <Select
            value={form.accountAgeRule.type}
            onChange={(e) => setAccountAgeRule({ type: e.target.value })}
          >
            <option value="none">No restriction</option>
            <option value="relative">Relative — created within the last N days</option>
            <option value="absolute">Absolute — created between two dates</option>
          </Select>

          {form.accountAgeRule.type === "relative" && (
            <Input
              className="mt-3"
              label="Created within the last (days)"
              type="number"
              min={1}
              value={form.accountAgeRule.relativeDays}
              onChange={(e) => setAccountAgeRule({ relativeDays: e.target.value })}
              placeholder="7"
            />
          )}

          {form.accountAgeRule.type === "absolute" && (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <Input
                label="Created after"
                type="date"
                value={form.accountAgeRule.startDate}
                onChange={(e) => setAccountAgeRule({ startDate: e.target.value })}
              />
              <Input
                label="Created before"
                type="date"
                value={form.accountAgeRule.endDate}
                onChange={(e) => setAccountAgeRule({ endDate: e.target.value })}
              />
            </div>
          )}
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
