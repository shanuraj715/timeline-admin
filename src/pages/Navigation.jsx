import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { fetchNavItems, createNavItem, updateNavItem, deleteNavItem, reorderNavItems } from "../api/cms";
import { Card, CardBody } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Input, Checkbox } from "../components/ui/Input";
import { Switch } from "../components/ui/Switch";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../context/ToastContext";

// Compact "which devices" indicator for the list table — full labels live
// in the edit modal's own checkboxes.
function VisibilityBadges({ item }) {
  const devices = [
    { key: "showOnMobile", label: "M" },
    { key: "showOnTablet", label: "T" },
    { key: "showOnDesktop", label: "D" },
  ];
  return (
    <div className="flex gap-1">
      {devices.map((d) => (
        <Badge key={d.key} tone={item[d.key] ? "primary" : "neutral"}>
          {d.label}
        </Badge>
      ))}
    </div>
  );
}

const EMPTY_ITEM = {
  label: "",
  url: "",
  openInNewTab: false,
  enabled: true,
  showOnMobile: true,
  showOnTablet: true,
  showOnDesktop: true,
  children: [],
};

export default function Navigation() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: items = [], isLoading } = useQuery({ queryKey: ["nav"], queryFn: fetchNavItems });

  const [modalItem, setModalItem] = useState(null); // null = closed, {} = new, item = editing
  const [deleteTarget, setDeleteTarget] = useState(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["nav"] });
  }

  const saveMutation = useMutation({
    mutationFn: (item) => (item._id ? updateNavItem(item._id, item) : createNavItem(item)),
    onSuccess: () => {
      invalidate();
      setModalItem(null);
      toast("Nav item saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteNavItem(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast("Nav item deleted", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => updateNavItem(id, { enabled }),
    onSuccess: invalidate,
    onError: (err) => toast(err.message, "error"),
  });

  async function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    // Re-numbers the *whole* list to sequential 0..n-1 based on the new
    // visual order, rather than swapping the two moved items' existing
    // `order` values — items created via "Add item" have no order field in
    // EMPTY_ITEM below, so every item historically landed on the schema's
    // default of 0. Swapping 0 with 0 is a no-op, which is exactly why
    // reordering looked broken. Reassigning the full list on every move is
    // self-healing regardless of whatever's currently stored.
    const reordered = items.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await reorderNavItems(reordered.map((item, i) => ({ id: item._id, order: i })));
    invalidate();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Navigation</h1>
          <p className="text-sm text-text-muted">Header menu items shown on the public site.</p>
        </div>
        <Button onClick={() => setModalItem({ ...EMPTY_ITEM, order: items.length })}>
          <Plus size={16} /> Add item
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <CardBody>Loading…</CardBody>
        ) : items.length === 0 ? (
          <EmptyState title="No nav items yet" description="Add your first header menu item." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Order</Th>
                <Th>Label</Th>
                <Th>URL</Th>
                <Th>Children</Th>
                <Th>Visible on</Th>
                <Th>Enabled</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {items.map((item, index) => (
                <Tr key={item._id}>
                  <Td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        className="rounded px-1 text-text-muted hover:bg-surface-hover disabled:opacity-30"
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => move(index, 1)}
                        disabled={index === items.length - 1}
                        className="rounded px-1 text-text-muted hover:bg-surface-hover disabled:opacity-30"
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  </Td>
                  <Td className="font-medium">{item.label}</Td>
                  <Td className="text-text-muted">{item.url}</Td>
                  <Td className="text-text-muted">{item.children.length || "—"}</Td>
                  <Td>
                    <VisibilityBadges item={item} />
                  </Td>
                  <Td>
                    <Switch
                      checked={item.enabled}
                      onChange={(enabled) => toggleMutation.mutate({ id: item._id, enabled })}
                    />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <IconButton label="Edit nav item" icon={Pencil} onClick={() => setModalItem(item)} />
                      <IconButton label="Delete nav item" icon={Trash2} variant="danger" onClick={() => setDeleteTarget(item)} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {modalItem && (
        <NavItemModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onSave={(data) => saveMutation.mutate(data)}
          saving={saveMutation.isPending}
        />
      )}

      {deleteTarget && (
        <Modal
          open
          onClose={() => setDeleteTarget(null)}
          title="Delete nav item"
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

function NavItemModal({ item, onClose, onSave, saving }) {
  const [form, setForm] = useState({ ...item, children: item.children?.map((c) => ({ ...c })) || [] });

  function addChild() {
    setForm((f) => ({ ...f, children: [...f.children, { label: "", url: "", openInNewTab: false, enabled: true }] }));
  }
  function updateChild(index, patch) {
    setForm((f) => ({
      ...f,
      children: f.children.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  }
  function removeChild(index) {
    setForm((f) => ({ ...f, children: f.children.filter((_, i) => i !== index) }));
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={item._id ? "Edit nav item" : "Add nav item"}
      width="560px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)} disabled={saving || !form.label || !form.url}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <Input label="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="/about-us" />
        <div className="flex gap-4">
          <Checkbox
            label="Open in new tab"
            checked={form.openInNewTab}
            onChange={(e) => setForm({ ...form, openInNewTab: e.target.checked })}
          />
          <Checkbox
            label="Enabled"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">Visible on</span>
          <div className="flex gap-4">
            <Checkbox
              label="Mobile"
              checked={form.showOnMobile}
              onChange={(e) => setForm({ ...form, showOnMobile: e.target.checked })}
            />
            <Checkbox
              label="Tablet"
              checked={form.showOnTablet}
              onChange={(e) => setForm({ ...form, showOnTablet: e.target.checked })}
            />
            <Checkbox
              label="Desktop"
              checked={form.showOnDesktop}
              onChange={(e) => setForm({ ...form, showOnDesktop: e.target.checked })}
            />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-text">Dropdown children</span>
            <Button variant="secondary" size="sm" onClick={addChild}>
              Add child
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {form.children.map((child, index) => (
              <div key={index} className="flex items-end gap-2">
                <Input
                  className="flex-1"
                  placeholder="Label"
                  value={child.label}
                  onChange={(e) => updateChild(index, { label: e.target.value })}
                />
                <Input
                  className="flex-1"
                  placeholder="URL"
                  value={child.url}
                  onChange={(e) => updateChild(index, { url: e.target.value })}
                />
                <Button variant="ghost" size="sm" onClick={() => removeChild(index)}>
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
