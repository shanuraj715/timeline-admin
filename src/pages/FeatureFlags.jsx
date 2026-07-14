import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { fetchFlags, createFlag, updateFlag, deleteFlag } from "../api/featureFlags";
import { Card, CardBody } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Input, Textarea } from "../components/ui/Input";
import { Switch } from "../components/ui/Switch";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";

const EMPTY_FLAG = { key: "", label: "", description: "", enabled: true };

export default function FeatureFlags() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: flags = [], isLoading } = useQuery({ queryKey: ["flags"], queryFn: fetchFlags });

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["flags"] });
  }

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => updateFlag(id, { enabled }),
    onSuccess: invalidate,
    onError: (err) => toast(err.message, "error"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => createFlag(data),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      toast("Flag created", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFlag(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast("Flag deleted", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Feature flags</h1>
          <p className="text-sm text-text-muted">Turn site features on or off without a deploy.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Add flag</Button>
      </div>

      <Card>
        {isLoading ? (
          <CardBody>Loading…</CardBody>
        ) : flags.length === 0 ? (
          <EmptyState title="No feature flags yet" />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Label</Th>
                <Th>Key</Th>
                <Th>Description</Th>
                <Th>Enabled</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {flags.map((flag) => (
                <Tr key={flag._id}>
                  <Td className="font-medium">{flag.label}</Td>
                  <Td>
                    <code className="text-xs text-text-muted">{flag.key}</code>
                  </Td>
                  <Td className="text-text-muted">{flag.description || "—"}</Td>
                  <Td>
                    <Switch
                      checked={flag.enabled}
                      onChange={(enabled) => toggleMutation.mutate({ id: flag._id, enabled })}
                    />
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <IconButton label="Delete flag" icon={Trash2} variant="danger" onClick={() => setDeleteTarget(flag)} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {modalOpen && (
        <FlagModal
          onClose={() => setModalOpen(false)}
          onSave={(data) => createMutation.mutate(data)}
          saving={createMutation.isPending}
        />
      )}

      {deleteTarget && (
        <Modal
          open
          onClose={() => setDeleteTarget(null)}
          title="Delete flag"
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
            Delete "<strong>{deleteTarget.label}</strong>"? This can't be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}

function FlagModal({ onClose, onSave, saving }) {
  const [form, setForm] = useState({ ...EMPTY_FLAG });

  return (
    <Modal
      open
      onClose={onClose}
      title="Add feature flag"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)} disabled={saving || !form.key || !form.label}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Key"
          value={form.key}
          onChange={(e) => setForm({ ...form, key: e.target.value })}
          placeholder="my_new_flag"
        />
        <Input label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <Textarea
          label="Description"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
    </Modal>
  );
}
