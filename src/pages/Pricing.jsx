import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { fetchPlans, createPlan, updatePlan, deletePlan } from "../api/billing";
import { fetchCurrencies } from "../api/currencies";
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
  prices: {},
  isActive: true,
  isFeatured: false,
};

// `undefined` locale lets Intl use the runtime's own locale while still
// rendering the correct symbol/decimal-places for whatever `currency` code
// is given.
function formatPrice(paise, currency) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(paise / 100);
}

// A plan's "headline" price for the list view — its default currency if
// priced there, otherwise whichever currency it has a price for first.
function headlinePrice(plan, currencies) {
  const defaultCode = currencies.find((c) => c.isDefault)?.code;
  const code = defaultCode && plan.prices?.[defaultCode] != null ? defaultCode : Object.keys(plan.prices || {})[0];
  if (!code) return "—";
  return formatPrice(plan.prices[code], code);
}

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function Pricing() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: plans = [], isLoading } = useQuery({ queryKey: ["plans"], queryFn: fetchPlans });
  const { data: currencies = [] } = useQuery({ queryKey: ["currencies"], queryFn: fetchCurrencies });

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
                  <Td>{headlinePrice(plan, currencies)}</Td>
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
          currencies={currencies}
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

function PlanModal({ plan, currencies, onClose, onSave, saving }) {
  // Every currency gets an input regardless of enabled state — so turning
  // one on later never exposes an unset price. Missing entries (a brand
  // new plan, or a currency added after this plan was created) default to 0.
  const initialPrices = Object.fromEntries(currencies.map((c) => [c.code, plan.prices?.[c.code] ?? 0]));
  const [form, setForm] = useState({ ...plan, prices: initialPrices });
  const [slugTouched, setSlugTouched] = useState(Boolean(plan._id));

  function handleNameChange(e) {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  }

  function setPrice(code, amount) {
    setForm((f) => ({ ...f, prices: { ...f.prices, [code]: amount } }));
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
        <Input
          label="Credits"
          type="number"
          min={1}
          value={form.credits}
          onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
        />
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-text">Price per currency (smallest unit — paise, cents, ...)</p>
          {currencies.length === 0 ? (
            <p className="text-xs text-text-muted">
              No currencies set up yet — add one under the Currencies tab first.
            </p>
          ) : (
            currencies.map((currency) => (
              <div key={currency.code} className="grid grid-cols-[5rem_1fr_auto] items-center gap-3">
                <span className="text-sm text-text-muted">
                  {currency.code}
                  {!currency.isEnabled && <span className="ml-1 text-xs">(disabled)</span>}
                </span>
                <Input
                  type="number"
                  min={0}
                  value={form.prices[currency.code] ?? 0}
                  onChange={(e) => setPrice(currency.code, Number(e.target.value))}
                />
                <span className="w-24 text-right text-xs text-text-muted">
                  {formatPrice(form.prices[currency.code] || 0, currency.code)}
                </span>
              </div>
            ))
          )}
        </div>
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
