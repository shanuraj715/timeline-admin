import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { fetchCurrencies, createCurrency, updateCurrency, deleteCurrency } from "../api/currencies";
import { Card, CardBody } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Input } from "../components/ui/Input";
import { Switch } from "../components/ui/Switch";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";

const EMPTY_CURRENCY = { code: "", name: "", symbol: "" };

export default function Currencies() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: currencies = [], isLoading } = useQuery({ queryKey: ["currencies"], queryFn: fetchCurrencies });

  const [modalCurrency, setModalCurrency] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["currencies"] });
  }

  const saveMutation = useMutation({
    mutationFn: (currency) =>
      currency._id
        ? updateCurrency(currency._id, { name: currency.name, symbol: currency.symbol })
        : createCurrency(currency),
    onSuccess: () => {
      invalidate();
      setModalCurrency(null);
      toast("Currency saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCurrency(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast("Currency deleted", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }) => updateCurrency(id, { isEnabled }),
    onSuccess: invalidate,
    onError: (err) => toast(err.message, "error"),
  });

  const defaultMutation = useMutation({
    mutationFn: (id) => updateCurrency(id, { isDefault: true }),
    onSuccess: () => {
      invalidate();
      toast("Default currency updated", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Currencies</h1>
          <p className="text-sm text-text-muted">
            Enabled currencies are offered to users; every plan is priced in every currency here regardless of
            whether it's enabled, so turning one on never shows an unset price.
          </p>
        </div>
        <Button onClick={() => setModalCurrency({ ...EMPTY_CURRENCY })}>
          <Plus size={16} /> Add currency
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <CardBody>Loading…</CardBody>
        ) : currencies.length === 0 ? (
          <EmptyState title="No currencies yet" description="Add your first currency." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Code</Th>
                <Th>Name</Th>
                <Th>Symbol</Th>
                <Th>Default</Th>
                <Th>Enabled</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {currencies.map((currency) => (
                <Tr key={currency._id}>
                  <Td className="font-medium">{currency.code}</Td>
                  <Td>{currency.name}</Td>
                  <Td>{currency.symbol}</Td>
                  <Td>
                    {currency.isDefault ? (
                      <Badge tone="primary">Default</Badge>
                    ) : (
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-text-muted hover:text-text"
                        onClick={() => defaultMutation.mutate(currency._id)}
                        disabled={defaultMutation.isPending}
                      >
                        <Star size={12} /> Set default
                      </button>
                    )}
                  </Td>
                  <Td>
                    <Switch
                      checked={currency.isEnabled}
                      onChange={(isEnabled) => toggleMutation.mutate({ id: currency._id, isEnabled })}
                    />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <IconButton label="Edit currency" icon={Pencil} onClick={() => setModalCurrency(currency)} />
                      <IconButton
                        label="Delete currency"
                        icon={Trash2}
                        variant="danger"
                        onClick={() => setDeleteTarget(currency)}
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {modalCurrency && (
        <CurrencyModal
          currency={modalCurrency}
          onClose={() => setModalCurrency(null)}
          onSave={(data) => saveMutation.mutate(data)}
          saving={saveMutation.isPending}
        />
      )}

      {deleteTarget && (
        <Modal
          open
          onClose={() => setDeleteTarget(null)}
          title="Delete currency"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(deleteTarget._id)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-text">
            Delete "<strong>{deleteTarget.name}</strong>"? This removes its price from every pricing plan too. This
            can't be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}

function CurrencyModal({ currency, onClose, onSave, saving }) {
  const [form, setForm] = useState({ ...currency });
  const isEdit = Boolean(currency._id);

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit currency" : "Add currency"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)} disabled={saving || !form.code || !form.name || !form.symbol}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Code (ISO 4217, e.g. USD)"
          value={form.code}
          maxLength={3}
          disabled={isEdit}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
        />
        {isEdit && <p className="-mt-2 text-xs text-text-muted">The code can't be changed after creation.</p>}
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input
          label="Symbol (e.g. $, ₹, €)"
          value={form.symbol}
          onChange={(e) => setForm({ ...form, symbol: e.target.value })}
        />
      </div>
    </Modal>
  );
}
