import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchFooterColumns,
  createFooterColumn,
  updateFooterColumn,
  deleteFooterColumn,
  reorderFooterColumns,
} from "../api/cms";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Checkbox } from "../components/ui/Input";
import { Switch } from "../components/ui/Switch";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/Table";
import { useToast } from "../context/ToastContext";

const EMPTY_COLUMN = { title: "", enabled: true, links: [] };

export default function Footer() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: columns = [], isLoading } = useQuery({ queryKey: ["footer"], queryFn: fetchFooterColumns });

  const [modalColumn, setModalColumn] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["footer"] });
  }

  const saveMutation = useMutation({
    mutationFn: (col) => (col._id ? updateFooterColumn(col._id, col) : createFooterColumn(col)),
    onSuccess: () => {
      invalidate();
      setModalColumn(null);
      toast("Footer column saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFooterColumn(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast("Footer column deleted", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => updateFooterColumn(id, { enabled }),
    onSuccess: invalidate,
    onError: (err) => toast(err.message, "error"),
  });

  async function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= columns.length) return;
    const a = columns[index];
    const b = columns[target];
    await reorderFooterColumns([
      { id: a._id, order: b.order },
      { id: b._id, order: a.order },
    ]);
    invalidate();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Footer</h1>
          <p className="text-sm text-text-muted">Columns and links shown in the public site footer.</p>
        </div>
        <Button onClick={() => setModalColumn({ ...EMPTY_COLUMN })}>Add column</Button>
      </div>

      {isLoading ? (
        <Card>
          <CardBody>Loading…</CardBody>
        </Card>
      ) : columns.length === 0 ? (
        <Card>
          <EmptyState title="No footer columns yet" description="Add your first footer column." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {columns.map((col, index) => (
            <Card key={col._id} className="flex flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="font-medium text-text">{col.title}</span>
                <Switch checked={col.enabled} onChange={(enabled) => toggleMutation.mutate({ id: col._id, enabled })} />
              </div>
              <CardBody className="flex-1">
                <ul className="flex flex-col gap-1 text-sm text-text-muted">
                  {col.links.length === 0 ? (
                    <li className="italic">No links</li>
                  ) : (
                    col.links.map((l, i) => (
                      <li key={i}>
                        {l.label} <span className="text-text-muted">— {l.url}</span>
                      </li>
                    ))
                  )}
                </ul>
              </CardBody>
              <div className="flex items-center justify-between border-t border-border px-4 py-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded px-1 text-text-muted hover:bg-surface-hover disabled:opacity-30"
                    aria-label="Move left"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === columns.length - 1}
                    className="rounded px-1 text-text-muted hover:bg-surface-hover disabled:opacity-30"
                    aria-label="Move right"
                  >
                    ↓
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setModalColumn(col)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(col)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalColumn && (
        <FooterColumnModal
          column={modalColumn}
          onClose={() => setModalColumn(null)}
          onSave={(data) => saveMutation.mutate(data)}
          saving={saveMutation.isPending}
        />
      )}

      {deleteTarget && (
        <Modal
          open
          onClose={() => setDeleteTarget(null)}
          title="Delete footer column"
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
            Delete "<strong>{deleteTarget.title}</strong>"? This can't be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}

function FooterColumnModal({ column, onClose, onSave, saving }) {
  const [form, setForm] = useState({ ...column, links: column.links?.map((l) => ({ ...l })) || [] });

  function addLink() {
    setForm((f) => ({ ...f, links: [...f.links, { label: "", url: "", openInNewTab: false }] }));
  }
  function updateLink(index, patch) {
    setForm((f) => ({ ...f, links: f.links.map((l, i) => (i === index ? { ...l, ...patch } : l)) }));
  }
  function removeLink(index) {
    setForm((f) => ({ ...f, links: f.links.filter((_, i) => i !== index) }));
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={column._id ? "Edit footer column" : "Add footer column"}
      width="560px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)} disabled={saving || !form.title}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Checkbox
          label="Enabled"
          checked={form.enabled}
          onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
        />

        <div className="border-t border-border pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-text">Links</span>
            <Button variant="secondary" size="sm" onClick={addLink}>
              Add link
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {form.links.map((link, index) => (
              <div key={index} className="flex items-end gap-2">
                <Input
                  className="flex-1"
                  placeholder="Label"
                  value={link.label}
                  onChange={(e) => updateLink(index, { label: e.target.value })}
                />
                <Input
                  className="flex-1"
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) => updateLink(index, { url: e.target.value })}
                />
                <Button variant="ghost" size="sm" onClick={() => removeLink(index)}>
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
