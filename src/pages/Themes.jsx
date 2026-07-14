import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Star, Pencil, Trash2, Palette, Image as ImageIcon, SlidersHorizontal, Waypoints, X, Eye } from "lucide-react";
import { fetchThemes, createTheme, updateTheme, deleteTheme, setDefaultTheme, uploadThemeImage } from "../api/themes";
import { Card, CardBody } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
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
                        <IconButton
                          label="Set as site default"
                          icon={Star}
                          onClick={() => setDefaultMutation.mutate(theme.id)}
                        />
                      )}
                      <IconButton label="Edit theme" icon={Pencil} onClick={() => setModalTheme(theme)} />
                      <IconButton label="Delete theme" icon={Trash2} variant="danger" onClick={() => setDeleteTarget(theme)} />
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

function SectionHeader({ icon, title, description }) {
  const Icon = icon;
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon size={15} />
      </span>
      <div>
        <p className="text-sm font-semibold text-text">{title}</p>
        {description && <p className="mt-0.5 text-xs text-text-muted">{description}</p>}
      </div>
    </div>
  );
}

// Swatch (opens the native picker) + a hex text field side by side, instead
// of a bare <input type="color"> — browsers render those wildly
// inconsistently (a huge flat rectangle in some, a tiny swatch with no hex
// value visible in others) and there's no way to type an exact hex code.
// `allowClear` renders a checkerboard "not set" state and a clear button —
// used for the optional node/edge/date-chip fields, where empty means
// "inherit the app's default" rather than "black".
function ColorField({ label, value, onChange, allowClear = false }) {
  const inputRef = useRef(null);
  const hasValue = Boolean(value);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={`Pick ${label}`}
          className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border"
          style={
            hasValue
              ? { background: value }
              : {
                  backgroundImage:
                    "linear-gradient(45deg, var(--border) 25%, transparent 25%), linear-gradient(-45deg, var(--border) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--border) 75%), linear-gradient(-45deg, transparent 75%, var(--border) 75%)",
                  backgroundSize: "8px 8px",
                  backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                }
          }
        >
          <input
            ref={inputRef}
            type="color"
            value={hasValue ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </button>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={allowClear ? "Not set" : "#000000"}
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 font-mono text-sm text-text placeholder:text-text-muted focus:outline-2 focus:outline-primary"
        />
        {allowClear && hasValue && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={`Clear ${label}`}
            className="shrink-0 rounded-md p-1.5 text-text-muted hover:bg-surface-hover hover:text-text"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// Mirrors timeline/src/app/timeline/[slug]/page.module.scss's .themeWash and
// timeline/src/components/timeline/day-node.module.scss exactly (same
// gradient angle, color-mix percentages, opacity math, chip padding/font,
// node/edge sizing) — this is a from-scratch reimplementation, not shared
// code (separate app, no shared package), so if either changes the other
// needs updating by hand to keep the preview honest.
function ThemePreview({ form }) {
  const opacity = (form.overlayOpacity ?? 60) / 100;
  const overlayStyle = form.overlayStyle || "gradient";
  const primary = form.colors.primary || "#0a84ff";
  const secondary = form.colors.secondary || "#6e6e73";

  const overlayBackground =
    overlayStyle === "solid"
      ? primary
      : `linear-gradient(165deg, color-mix(in srgb, ${primary} 60%, black 15%) 0%, color-mix(in srgb, ${secondary} 65%, black 35%) 100%)`;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div
        className="relative flex h-32 items-end p-3"
        style={{
          backgroundImage: form.imageUrl ? `url(${form.imageUrl})` : "none",
          backgroundSize: "cover",
          backgroundPosition: form.imagePosition || "center",
          backgroundColor: primary,
        }}
      >
        {overlayStyle !== "none" && (
          <div className="absolute inset-0" style={{ background: overlayBackground, opacity }} />
        )}
        <span
          className="relative rounded-full px-2.5 py-[3px] text-[11px] font-semibold shadow"
          style={{
            color: form.colors.dateChipText || "#f5f5f7",
            background: form.colors.dateChipBackground || "rgba(20, 20, 20, 0.55)",
          }}
        >
          14 Jul 2026
        </span>
      </div>
      <div className="flex items-center gap-3 border-t border-border bg-surface px-4 py-3">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: form.colors.node || "var(--primary)" }} />
        <span className="h-px flex-1" style={{ background: form.colors.edge || "var(--border)" }} />
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: form.colors.node || "var(--primary)" }} />
        <span className="h-px flex-1" style={{ background: form.colors.edge || "var(--border)" }} />
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: form.colors.node || "var(--primary)" }} />
      </div>
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
      width="640px"
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
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <SectionHeader
            icon={Eye}
            title="Preview"
            description="Matches how this theme renders on an actual timeline — updates live as you edit."
          />
          <ThemePreview form={form} />
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-5">
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
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <SectionHeader icon={Palette} title="Colors" description="The theme's core palette." />
          <div className="grid grid-cols-3 gap-3">
            <ColorField label="Primary" value={form.colors.primary} onChange={(v) => setColor("primary", v)} />
            <ColorField label="Secondary" value={form.colors.secondary} onChange={(v) => setColor("secondary", v)} />
            <ColorField
              label="Background"
              value={form.colors.background}
              onChange={(v) => setColor("background", v)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <SectionHeader icon={ImageIcon} title="Background image" />
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

        <div className="flex flex-col gap-4 border-t border-border pt-5">
          <SectionHeader icon={SlidersHorizontal} title="How the wash renders" />
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
            <div>
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

        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <SectionHeader
            icon={Waypoints}
            title="Timeline line & date colors"
            description="Optional — leave unset to use the app's default styling for the connector line, dots, and date labels."
          />
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Node (dot) color"
              value={form.colors.node}
              onChange={(v) => setColor("node", v)}
              allowClear
            />
            <ColorField
              label="Edge (line) color"
              value={form.colors.edge}
              onChange={(v) => setColor("edge", v)}
              allowClear
            />
            <ColorField
              label="Date chip background"
              value={form.colors.dateChipBackground}
              onChange={(v) => setColor("dateChipBackground", v)}
              allowClear
            />
            <ColorField
              label="Date chip text"
              value={form.colors.dateChipText}
              onChange={(v) => setColor("dateChipText", v)}
              allowClear
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
