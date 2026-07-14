import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { fetchThemes, createTheme, updateTheme, deleteTheme, setDefaultTheme, uploadThemeImage } from "../api/themes";
import { Card, CardBody } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Input, Textarea, Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";

const EMPTY_THEME = {
  name: "",
  slug: "",
  category: "",
  description: "",
  colors: {
    primary: "#0a84ff",
    secondary: "#6e6e73",
    background: "#fbfbfd",
    node: "",
    edge: "",
    dateChipBackground: "",
    dateChipText: "",
  },
  imagePosition: "center",
  overlayStyle: "gradient",
  overlayOpacity: 60,
  priceCredits: 0,
  status: "draft",
};

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function Themes() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: themes = [], isLoading } = useQuery({ queryKey: ["themes"], queryFn: fetchThemes });

  const [modalTheme, setModalTheme] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["themes"] });
  }

  const saveMutation = useMutation({
    mutationFn: (theme) => (theme.id ? updateTheme(theme.id, theme) : createTheme(theme)),
    onSuccess: (saved) => {
      invalidate();
      setModalTheme(saved); // keep modal open, now in "edit" mode so image upload becomes available
      toast("Theme saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTheme(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast("Theme deleted", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id) => setDefaultTheme(id),
    onSuccess: () => {
      invalidate();
      toast("Set as site default", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Themes</h1>
          <p className="text-sm text-text-muted">
            Design timeline themes. Publish one and set it as the site default to apply it free to every new timeline.
          </p>
        </div>
        <Button onClick={() => setModalTheme({ ...EMPTY_THEME })}>
          <Plus size={16} /> Add theme
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <CardBody>Loading…</CardBody>
        ) : themes.length === 0 ? (
          <EmptyState title="No themes yet" description="Add your first theme." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Status</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {themes.map((theme) => (
                <Tr key={theme.id}>
                  <Td className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 shrink-0 overflow-hidden rounded-full border border-border">
                        <span style={{ background: theme.colors.primary, width: "50%" }} />
                        <span style={{ background: theme.colors.secondary, width: "50%" }} />
                      </span>
                      {theme.name}
                      {theme.isDefault && <Badge tone="primary">Default</Badge>}
                    </div>
                  </Td>
                  <Td className="text-text-muted">{theme.category || "—"}</Td>
                  <Td>{theme.priceCredits === 0 ? "Free" : `${theme.priceCredits} credits`}</Td>
                  <Td>
                    <Badge tone={theme.status === "published" ? "success" : "neutral"}>{theme.status}</Badge>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      {theme.status === "published" && !theme.isDefault && (
                        <Button variant="secondary" size="sm" onClick={() => setDefaultMutation.mutate(theme.id)}>
                          Set as default
                        </Button>
                      )}
                      <Button variant="secondary" size="sm" onClick={() => setModalTheme(theme)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteTarget(theme)}>
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

      {modalTheme && (
        <ThemeModal
          theme={modalTheme}
          onClose={() => setModalTheme(null)}
          onSave={(data) => saveMutation.mutate(data)}
          saving={saveMutation.isPending}
          onImageUploaded={(updated) => {
            invalidate();
            setModalTheme(updated);
          }}
        />
      )}

      {deleteTarget && (
        <Modal
          open
          onClose={() => setDeleteTarget(null)}
          title="Delete theme"
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
            Delete "<strong>{deleteTarget.name}</strong>"? This can't be undone, and fails if the theme is currently the
            site default or in use by any timeline.
          </p>
        </Modal>
      )}
    </div>
  );
}

function ThemeModal({ theme, onClose, onSave, saving, onImageUploaded }) {
  const [form, setForm] = useState({ ...theme, colors: { ...theme.colors } });
  const [slugTouched, setSlugTouched] = useState(Boolean(theme.id));
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  function handleNameChange(e) {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  }

  function setColor(key, value) {
    setForm((f) => ({ ...f, colors: { ...f.colors, [key]: value } }));
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await uploadThemeImage(theme.id, file);
      onImageUploaded(updated);
      toast("Image uploaded", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={theme.id ? "Edit theme" : "Add theme"}
      width="560px"
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
        <Input
          label="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          placeholder="mountain, birthday, ocean…"
        />
        <Textarea
          label="Description"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-text">Colors</span>
          <div className="grid grid-cols-3 gap-3">
            {["primary", "secondary", "background"].map((key) => (
              <label key={key} className="flex flex-col items-center gap-1">
                <input
                  type="color"
                  value={form.colors[key]}
                  onChange={(e) => setColor(key, e.target.value)}
                  className="h-9 w-full cursor-pointer rounded border border-border bg-transparent"
                />
                <span className="text-xs capitalize text-text-muted">{key}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Price (credits)"
            type="number"
            min={0}
            value={form.priceCredits}
            onChange={(e) => setForm({ ...form, priceCredits: Number(e.target.value) })}
          />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </div>

        <div className="border-t border-border pt-4">
          <span className="mb-1.5 block text-sm font-medium text-text">Background image</span>
          {theme.id ? (
            <div className="flex items-center gap-3">
              {form.imageUrl && (
                <img
                  src={`${form.imageUrl}?t=${form.updatedAt || ""}`}
                  alt=""
                  className="h-16 w-24 rounded-md border border-border object-cover"
                />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="text-sm text-text-muted"
              />
            </div>
          ) : (
            <p className="text-sm text-text-muted">Save the theme first, then you can upload a background image.</p>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <span className="mb-2 block text-sm font-medium text-text">How the wash renders</span>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Image position"
              value={form.imagePosition}
              onChange={(e) => setForm({ ...form, imagePosition: e.target.value })}
            >
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </Select>
            <Select
              label="Overlay style"
              value={form.overlayStyle}
              onChange={(e) => setForm({ ...form, overlayStyle: e.target.value })}
            >
              <option value="gradient">Gradient (primary → secondary)</option>
              <option value="solid">Solid (primary only)</option>
              <option value="none">None (raw image)</option>
            </Select>
          </div>
          {form.overlayStyle !== "none" && (
            <div className="mt-4">
              <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-text">
                Overlay opacity
                <span className="text-text-muted">{form.overlayOpacity}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={form.overlayOpacity}
                onChange={(e) => setForm({ ...form, overlayOpacity: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <span className="mb-1.5 block text-sm font-medium text-text">Timeline line &amp; date colors</span>
          <p className="mb-3 text-xs text-text-muted">
            Optional — leave unset to use the app's default styling for the timeline's connector line, dots, and
            date labels.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "node", label: "Node (dot) color" },
              { key: "edge", label: "Edge (line) color" },
              { key: "dateChipBackground", label: "Date chip background" },
              { key: "dateChipText", label: "Date chip text" },
            ].map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">{label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.colors[key] || "#000000"}
                    onChange={(e) => setColor(key, e.target.value)}
                    className="h-9 w-full cursor-pointer rounded border border-border bg-transparent"
                  />
                  {form.colors[key] && (
                    <button
                      type="button"
                      onClick={() => setColor(key, "")}
                      className="shrink-0 text-xs text-text-muted hover:text-text"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
