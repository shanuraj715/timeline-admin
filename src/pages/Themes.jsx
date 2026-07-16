import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Star,
  Pencil,
  Trash2,
  Palette,
  Image as ImageIcon,
  SlidersHorizontal,
  Waypoints,
  Sparkles,
  Info,
  ChevronDown,
  X,
  Eye,
} from "lucide-react";
import {
  fetchThemes,
  createTheme,
  updateTheme,
  deleteTheme,
  setDefaultTheme,
  uploadThemeImage,
  deleteThemeImage,
} from "../api/themes";
import { Card, CardBody } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Input, Textarea, Select, FieldHelp } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Switch } from "../components/ui/Switch";
import { useToast } from "../context/ToastContext";

const NODE_SHAPES = ["circle", "square", "triangle", "heart", "diamond", "star", "pentagon", "hexagon"];
const EDGE_STYLES = ["line", "ribbon", "dashed", "dotted"];
const PARTICLE_EFFECTS = ["none", "sparkles", "leaves", "hearts", "confetti", "gifts", "snow"];

// Mirrors timeline/src/lib/theme/nodeShapes.js exactly (same reimplement-
// not-share caveat as ThemePreview's wash formula below).
const NODE_SHAPE_CLIP_PATH = {
  circle: "circle(50% at 50% 50%)",
  square: "inset(0)",
  triangle: "polygon(50% 0%, 0% 100%, 100% 100%)",
  heart:
    "polygon(50% 15%, 61% 3%, 76% 3%, 89% 13%, 95% 28%, 92% 44%, 82% 58%, 50% 87%, 18% 58%, 8% 44%, 5% 28%, 11% 13%, 24% 3%, 39% 3%)",
  diamond: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  star: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
  pentagon: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
  hexagon: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
};

// Mirrors timeline/src/components/timeline/particle-field.jsx's glyph sets.
// Snow has no glyph — it renders as a plain glowing white dot instead of
// the ❄️ emoji (real snow doesn't look like that), see PARTICLE_MOTION's
// renderMode below.
const PARTICLE_GLYPHS = {
  sparkles: ["✨", "⭐", "🌟"],
  leaves: ["🍂", "🍁", "🍃"],
  hearts: ["💖", "💕", "❤️"],
  confetti: ["🎉", "🎊", "🎈"],
  gifts: ["🎁"],
};

const EMPTY_THEME = {
  name: "",
  slug: "",
  category: "",
  description: "",
  colors: {
    primary: "#0a84ff",
    secondary: "#6e6e73",
    node: "",
    edge: "",
    dateChipBackground: "",
    dateChipText: "",
    nodeBorder: "",
  },
  imagePosition: "center",
  overlayStyle: "gradient",
  overlayOpacity: 60,
  glassEffect: false,
  glassBlur: 20,
  nodeShape: "circle",
  nodeBorderWidth: 4,
  nodeSize: 8,
  edgeStyle: "line",
  particleEffect: "none",
  particleCount: 24,
  particleSpeed: 1,
  particleMinSize: 14,
  particleMaxSize: 34,
  particleInteractive: false,
  particleInteractionStrength: 1,
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

// A collapsible form section: a clickable SectionHeader row with a chevron,
// plus its body — used throughout ThemeModal to cut scroll height on a form
// that otherwise has 6 stacked sections. `id` keys into ThemeModal's
// `collapsed` state so the "[" / "]" collapse-all / expand-all shortcuts
// (and the per-section click) both work through the same state.
//
// Animates via the CSS grid 0fr/1fr trick instead of conditionally
// rendering the body: the body stays mounted, and an outer grid row
// animates between a 0fr and 1fr track (clipped by the inner overflow-
// hidden div) so the height transitions smoothly without ever needing to
// measure the content's real height in JS.
function Section({ id, icon, title, description, collapsed, onToggle, border = true, gap = "gap-4", children }) {
  return (
    <div className={`flex flex-col ${border ? "border-t border-border pt-5" : ""}`}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={!collapsed}
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <SectionHeader icon={icon} title={title} description={description} />
        <ChevronDown
          size={16}
          className={`mt-1.5 shrink-0 text-text-muted transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`}
      >
        {/* -mx-1/px-1 cancel out visually (same bounding box as before) but
            give focus rings on edge-to-edge fields (e.g. a full-width
            Input's `focus:outline-2`) a sliver of room inside the clip box
            instead of getting flattened by overflow-hidden. */}
        <div className="-mx-1 overflow-hidden px-1">
          <div className={`flex flex-col ${gap} pt-4`}>{children}</div>
        </div>
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
function ColorField({ label, help, value, onChange, allowClear = false }) {
  const inputRef = useRef(null);
  const hasValue = Boolean(value);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
        {label}
        <FieldHelp text={help} />
      </span>
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

// A slider with its label/value row + optional help icon, factored out
// since the modal has several of these (overlay opacity, glass blur, node
// border width) that only differ in range and unit.
function SliderField({ label, help, value, onChange, min, max, step = 1, unit = "px" }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center justify-between text-sm font-medium text-text">
        <span className="flex items-center gap-1.5">
          {label}
          <FieldHelp text={help} />
        </span>
        <span className="font-normal text-text-muted">
          {value}
          {unit}
        </span>
      </label>
      {/* A bare range input's thin native track sits at a browser-default
          height much shorter than the h-9 Input/Select boxes it often
          shares a grid row with — wrapping it in a matching h-9 flex
          container centers the track so both line up. */}
      <div className="flex h-9 items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
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
// Same shape+border technique as day-node.module.scss's .dot: a larger
// border-colored layer behind a smaller fill-colored layer, both clipped
// to the same shape so the border reads as a ring around the shape's own
// outline rather than a plain box-shadow (which only ever worked for a
// circle).
function PreviewNode({ form }) {
  const clipPath = NODE_SHAPE_CLIP_PATH[form.nodeShape] || NODE_SHAPE_CLIP_PATH.circle;
  const size = form.nodeSize ?? 8;
  const borderWidth = form.nodeBorderWidth ?? 4;
  const fill = form.colors.node || "var(--primary)";
  const border = form.colors.nodeBorder || "var(--surface)";

  return (
    <span className="relative shrink-0" style={{ height: size, width: size }}>
      <span className="absolute" style={{ clipPath, background: border, inset: -borderWidth }} />
      <span className="absolute inset-0" style={{ clipPath, background: fill }} />
    </span>
  );
}

// Mirrors timeline/src/lib/theme/edgeStyles.js's EDGE_THICKNESS/DASH_PATTERN
// exactly (same reimplement-not-share caveat as the rest of this preview) —
// including ribbon's satin-sheen gradient (dark edges, bright highlight
// center) across its own thickness, since a plain thick bar doesn't read as
// a ribbon at all.
const EDGE_THICKNESS = { line: 1, ribbon: 7, dashed: 1, dotted: 1 };
const EDGE_DASH_PATTERN = {
  dashed: "0 6px, transparent 6px 12px",
  dotted: "0 2px, transparent 2px 6px",
};

function PreviewEdge({ form }) {
  const edgeStyle = form.edgeStyle || "line";
  const color = form.colors.edge || "var(--border)";
  const thickness = EDGE_THICKNESS[edgeStyle] ?? 1;
  const pattern = EDGE_DASH_PATTERN[edgeStyle];

  let background = color;
  if (edgeStyle === "ribbon") {
    background =
      `linear-gradient(to bottom, ` +
      `color-mix(in srgb, ${color} 60%, black) 0%, ` +
      `${color} 22%, ` +
      `color-mix(in srgb, ${color} 45%, white) 50%, ` +
      `${color} 78%, ` +
      `color-mix(in srgb, ${color} 60%, black) 100%)`;
  } else if (pattern) {
    background = `repeating-linear-gradient(to right, ${color} ${pattern})`;
  }

  return (
    <span
      className="flex-1"
      style={{
        height: thickness,
        borderRadius: thickness,
        background,
      }}
    />
  );
}

// Mirrors timeline/src/components/timeline/particle-field.jsx's MOTION
// table exactly (same reimplement-not-share caveat) — same gravity/drag/
// wind-sway physics, just capped to fewer particles and scaled to the tiny
// preview box instead of the full viewport, so "preview and applied theme
// UI should not vary" holds for motion too, not just static appearance.
// renderMode "dot" draws a plain glowing white circle (sized via a
// width/height style, not font-size) instead of an emoji glyph — used for
// snow, since real snow doesn't look like the ❄️ character.
const PARTICLE_MOTION = {
  sparkles: { gravity: 40, swayAmp: 10, swayFreq: 1.1, spin: 40, twinkle: true, renderMode: "glyph" },
  leaves: { gravity: 70, swayAmp: 22, swayFreq: 0.6, spin: 90, twinkle: false, renderMode: "glyph" },
  hearts: { gravity: 55, swayAmp: 14, swayFreq: 0.8, spin: 50, twinkle: false, renderMode: "glyph" },
  confetti: { gravity: 110, swayAmp: 18, swayFreq: 1.5, spin: 220, twinkle: false, renderMode: "glyph" },
  gifts: { gravity: 140, swayAmp: 6, swayFreq: 0.5, spin: 60, twinkle: false, renderMode: "glyph" },
  snow: { gravity: 35, swayAmp: 16, swayFreq: 0.45, spin: 25, twinkle: true, renderMode: "dot" },
};

// Same influence radius/force shape as particle-field.jsx's pointer
// repulsion, just scaled down for the tiny preview box.
const PREVIEW_POINTER_RADIUS = 60;
const PREVIEW_POINTER_FORCE = 2200;

function PreviewParticles({ effect, count, speed, minSize, maxSize, interactive, interactionStrength }) {
  const motionDef = PARTICLE_MOTION[effect];
  const glyphs = PARTICLE_GLYPHS[effect];
  const containerRef = useRef(null);
  const nodeRefs = useRef([]);
  const physicsRef = useRef([]);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const [meta, setMeta] = useState([]);

  useEffect(() => {
    if (!motionDef) {
      setMeta([]);
      physicsRef.current = [];
      return;
    }
    const n = Math.min(count ?? 24, 16);
    const w = containerRef.current?.clientWidth || 300;
    const h = containerRef.current?.clientHeight || 190;
    const nextMeta = [];
    const nextPhysics = [];
    for (let i = 0; i < n; i++) {
      nextMeta.push({
        id: i,
        glyph: glyphs ? glyphs[Math.floor(Math.random() * glyphs.length)] : null,
        renderMode: motionDef.renderMode,
      });
      nextPhysics.push({
        depth: Math.random(),
        x: Math.random() * w,
        y: -Math.random() * h - 20,
        vx: 0,
        swayPhase: Math.random() * Math.PI * 2,
        rotation: Math.random() * 360,
        spinDir: Math.random() > 0.5 ? 1 : -1,
      });
    }
    physicsRef.current = nextPhysics;
    nodeRefs.current = [];
    setMeta(nextMeta);
  }, [motionDef, glyphs, count]);

  function updatePointer(clientX, clientY) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointerRef.current = { x: clientX - rect.left, y: clientY - rect.top, active: true };
  }

  useEffect(() => {
    if (meta.length === 0) return;
    const motion = PARTICLE_MOTION[effect] || PARTICLE_MOTION.sparkles;
    const spd = speed ?? 1;
    const minPx = minSize ?? 14;
    const maxPx = maxSize ?? 34;
    const strength = interactionStrength ?? 1;
    const sizeSpan = Math.max(0, maxPx - minPx);
    let frame;
    let last = performance.now();

    function tick(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;
      const w = containerRef.current?.clientWidth || 300;
      const h = containerRef.current?.clientHeight || 190;
      const pointer = pointerRef.current;

      physicsRef.current.forEach((p, i) => {
        const node = nodeRefs.current[i];
        if (!node) return;

        // Scaled down relative to the real page's viewport-based fall
        // speed so particles don't rocket through this much smaller box.
        const fallSpeed = (motion.gravity + p.depth * motion.gravity * 0.6) * spd * 0.4;
        p.y += fallSpeed * dt;
        p.rotation += p.spinDir * motion.spin * dt;

        if (interactive && pointer.active) {
          const radius = PREVIEW_POINTER_RADIUS * strength;
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < radius && dist > 0.01) {
            const push = ((radius - dist) / radius) * PREVIEW_POINTER_FORCE * strength;
            p.vx += (dx / dist) * push * dt;
            p.y += (dy / dist) * push * dt * 0.5;
          }
        }
        p.vx *= Math.max(0, 1 - 4 * dt);
        p.x += p.vx * dt;

        if (p.y > h + 20) {
          p.y = -20 - Math.random() * 30;
          p.x = Math.random() * w;
          p.vx = 0;
          p.swayPhase = Math.random() * Math.PI * 2;
        }

        const sway = Math.sin(t * motion.swayFreq + p.swayPhase) * motion.swayAmp;
        const baseSize = (minPx + p.depth * sizeSpan) * 0.55;
        const opacity = motion.twinkle
          ? 0.5 + p.depth * 0.4 + Math.sin(t * 2 + p.swayPhase) * 0.15
          : 0.5 + p.depth * 0.5;

        node.style.transform = `translate3d(${p.x + sway}px, ${p.y}px, 0) rotate(${p.rotation}deg)`;
        if (motion.renderMode === "dot") {
          node.style.width = `${baseSize}px`;
          node.style.height = `${baseSize}px`;
        } else {
          node.style.fontSize = `${baseSize}px`;
        }
        node.style.opacity = String(Math.max(0, Math.min(1, opacity)));
      });

      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [meta, effect, speed, minSize, maxSize, interactive, interactionStrength]);

  if (!motionDef) return null;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${interactive ? "" : "pointer-events-none"}`}
      onMouseMove={interactive ? (e) => updatePointer(e.clientX, e.clientY) : undefined}
      onMouseLeave={interactive ? () => (pointerRef.current.active = false) : undefined}
      onTouchMove={
        interactive
          ? (e) => {
              const touch = e.touches[0];
              if (touch) updatePointer(touch.clientX, touch.clientY);
            }
          : undefined
      }
      onTouchEnd={interactive ? () => (pointerRef.current.active = false) : undefined}
    >
      {meta.map((p, i) => (
        <span
          key={p.id}
          ref={(el) => (nodeRefs.current[i] = el)}
          className="absolute left-0 top-0 select-none"
          style={
            p.renderMode === "dot"
              ? {
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 35%, #ffffff, #eaf3ff 65%, rgba(255,255,255,0.3) 100%)",
                  boxShadow: "0 0 6px rgba(255,255,255,0.7)",
                }
              : undefined
          }
        >
          {p.renderMode === "dot" ? null : p.glyph}
        </span>
      ))}
    </div>
  );
}

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
        className="relative flex aspect-video items-end overflow-hidden p-3"
        style={{ backgroundColor: primary }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: form.imageUrl ? `url(${form.imageUrl})` : "none",
            backgroundSize: "cover",
            backgroundPosition: form.imagePosition || "center",
            filter: form.glassEffect ? `blur(${form.glassBlur ?? 20}px) saturate(1.4)` : "none",
          }}
        />
        {overlayStyle !== "none" && (
          <div className="absolute inset-0" style={{ background: overlayBackground, opacity }} />
        )}
        <PreviewParticles
          effect={form.particleEffect}
          count={form.particleCount}
          speed={form.particleSpeed}
          minSize={form.particleMinSize}
          maxSize={form.particleMaxSize}
          interactive={form.particleInteractive}
          interactionStrength={form.particleInteractionStrength}
        />
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
        <PreviewNode form={form} />
        <PreviewEdge form={form} />
        <PreviewNode form={form} />
        <PreviewEdge form={form} />
        <PreviewNode form={form} />
      </div>
    </div>
  );
}

// Every collapsible section in the form, in display order — used to build
// the "all collapsed" state for the "[" shortcut and to iterate for "]".
const SECTION_IDS = ["basic", "colors", "image", "wash", "line", "particles"];

function ThemeModal({ theme, onClose, onSave, saving, onImageUploaded }) {
  const [form, setForm] = useState({ ...theme, colors: { ...theme.colors } });
  const [slugTouched, setSlugTouched] = useState(Boolean(theme.id));
  const [uploading, setUploading] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const fileInputRef = useRef(null);
  const toast = useToast();

  function toggleSection(id) {
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));
  }

  // Ctrl/Cmd+P toggles the preview popup instead of the browser's print
  // dialog; "[" collapses every section and "]" expands them all, for
  // quickly cutting scroll height in a long form. The bracket shortcuts are
  // ignored while typing in a field (so a stray "[" in a description
  // doesn't collapse the form) — Ctrl/Cmd+P is safe everywhere since that
  // key combo is never typed literally into a text field.
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPreviewOpen((v) => !v);
        return;
      }
      const tag = e.target?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable;
      if (isTyping) return;
      if (e.key === "[") {
        setCollapsed(Object.fromEntries(SECTION_IDS.map((id) => [id, true])));
      } else if (e.key === "]") {
        setCollapsed({});
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // `form` is only ever seeded from `theme` once, on mount (the initial
  // useState value) — but the modal stays mounted across a save (Themes.jsx
  // keeps it open, now pointed at the freshly-created theme.id) and across
  // an image upload, so the fresh id/imageUrl/updatedAt from those never
  // reached `form` on their own. That's why the preview (and the small
  // thumbnail below) kept showing no image even right after uploading one.
  // Scoped to just these server-derived fields so it doesn't clobber
  // whatever the admin is mid-typing in the rest of the form.
  useEffect(() => {
    setForm((f) => ({ ...f, id: theme.id, imageUrl: theme.imageUrl, updatedAt: theme.updatedAt }));
  }, [theme.id, theme.imageUrl, theme.updatedAt]);

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

  async function handleRemoveImage() {
    setRemovingImage(true);
    try {
      const updated = await deleteThemeImage(theme.id);
      onImageUploaded(updated);
      toast("Image removed", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setRemovingImage(false);
    }
  }

  return (
    <>
    <Modal
      open
      onClose={onClose}
      title={theme.id ? "Edit theme" : "Add theme"}
      width="640px"
      headerExtra={
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-text-muted">
            Price
            <input
              type="number"
              min={0}
              value={form.priceCredits}
              onChange={(e) => setForm({ ...form, priceCredits: Number(e.target.value) })}
              className="h-8 w-16 rounded-md border border-border bg-surface px-2 text-sm text-text focus:outline-2 focus:outline-primary"
            />
            credits
          </label>
          <Switch
            checked={form.status === "published"}
            onChange={(v) => setForm({ ...form, status: v ? "published" : "draft" })}
            label="Published"
          />
        </div>
      }
      footer={
        <>
          <Button variant="secondary" className="mr-auto" onClick={() => setPreviewOpen(true)}>
            <Eye size={15} /> Preview <span className="text-xs opacity-60">(Ctrl+P)</span>
          </Button>
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
        <Section
          id="basic"
          icon={Info}
          title="Basic info"
          border={false}
          collapsed={collapsed.basic}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name"
              help="Shown to admins in this list, and to timeline owners once published."
              value={form.name}
              onChange={handleNameChange}
            />
            <Input
              label="Slug"
              help="URL-safe identifier, auto-filled from the name. Must be unique across all themes."
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
            />
          </div>
          <Input
            label="Category"
            help="Free-text label like 'mountain' or 'birthday', used for grouping in the theme catalog."
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="mountain, birthday, ocean…"
          />
          <Textarea
            label="Description"
            help="Shown to timeline owners browsing themes, to help them decide."
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Section>

        <Section
          id="colors"
          icon={Palette}
          title="Colors"
          description="The theme's core palette."
          gap="gap-3"
          collapsed={collapsed.colors}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Primary"
              help="The theme's main accent — the base wash color and the start of the gradient overlay."
              value={form.colors.primary}
              onChange={(v) => setColor("primary", v)}
            />
            <ColorField
              label="Secondary"
              help="The end color of the gradient overlay. Only visible when Overlay style is set to Gradient."
              value={form.colors.secondary}
              onChange={(v) => setColor("secondary", v)}
            />
          </div>
        </Section>

        <Section
          id="image"
          icon={ImageIcon}
          title="Background image"
          description="Shown behind the primary/secondary wash on the timeline page."
          gap="gap-3"
          collapsed={collapsed.image}
          onToggle={toggleSection}
        >
          {theme.id ? (
            <div className="flex items-center gap-3">
              {form.imageUrl && (
                <>
                  <img
                    src={`${form.imageUrl}?t=${form.updatedAt || ""}`}
                    alt=""
                    className="h-16 w-24 rounded-md border border-border object-cover"
                  />
                  <IconButton
                    label="Remove image"
                    icon={X}
                    variant="danger"
                    onClick={handleRemoveImage}
                    disabled={removingImage}
                  />
                </>
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
        </Section>

        <Section
          id="wash"
          icon={SlidersHorizontal}
          title="How the wash renders"
          collapsed={collapsed.wash}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Image position"
              help="Which part of the image stays in frame when it's cropped to fill the screen."
              value={form.imagePosition}
              onChange={(e) => setForm({ ...form, imagePosition: e.target.value })}
            >
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </Select>
            <Select
              label="Overlay style"
              help="How the color wash combines with the image: Gradient blends primary into secondary diagonally, Solid is a flat primary tint, None shows the raw image."
              value={form.overlayStyle}
              onChange={(e) => setForm({ ...form, overlayStyle: e.target.value })}
            >
              <option value="gradient">Gradient (primary → secondary)</option>
              <option value="solid">Solid (primary only)</option>
              <option value="none">None (raw image)</option>
            </Select>
          </div>
          {form.overlayStyle !== "none" && (
            <SliderField
              label="Overlay opacity"
              help="How strongly the color wash covers the image — 0% is invisible, 100% fully hides it."
              value={form.overlayOpacity}
              onChange={(v) => setForm({ ...form, overlayOpacity: v })}
              min={0}
              max={100}
              unit="%"
            />
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <Switch
                checked={form.glassEffect}
                onChange={(v) => setForm({ ...form, glassEffect: v })}
                label="Glass effect (blur the background image)"
              />
              <FieldHelp text="Blurs the background image into a soft frosted backdrop instead of a sharp photo. Off by default." />
            </div>
            {form.glassEffect && (
              <div className="mt-3">
                <SliderField
                  label="Blur amount"
                  help="How strong the blur is."
                  value={form.glassBlur}
                  onChange={(v) => setForm({ ...form, glassBlur: v })}
                  min={0}
                  max={40}
                />
              </div>
            )}
          </div>
        </Section>

        <Section
          id="line"
          icon={Waypoints}
          title="Timeline line & date colors"
          description="Optional — leave colors unset to use the app's default styling for the connector line, dots, and date labels."
          collapsed={collapsed.line}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Node shape"
              help="The shape of each day's marker dot on the timeline."
              value={form.nodeShape}
              onChange={(e) => setForm({ ...form, nodeShape: e.target.value })}
            >
              {NODE_SHAPES.map((shape) => (
                <option key={shape} value={shape}>
                  {shape[0].toUpperCase() + shape.slice(1)}
                </option>
              ))}
            </Select>
            <SliderField
              label="Node size"
              help="The marker dot's diameter."
              value={form.nodeSize}
              onChange={(v) => setForm({ ...form, nodeSize: v })}
              min={4}
              max={24}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Edge (line) style"
              help="How the connecting line between markers is drawn: a thin Line, a thicker Ribbon, or a Dashed / Dotted pattern."
              value={form.edgeStyle}
              onChange={(e) => setForm({ ...form, edgeStyle: e.target.value })}
            >
              {EDGE_STYLES.map((style) => (
                <option key={style} value={style}>
                  {style[0].toUpperCase() + style.slice(1)}
                </option>
              ))}
            </Select>
            <SliderField
              label="Node border width"
              help="Thickness of the ring around each marker dot. 0 hides it entirely."
              value={form.nodeBorderWidth}
              onChange={(v) => setForm({ ...form, nodeBorderWidth: v })}
              min={0}
              max={12}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Node (dot) color"
              help="Fill color of each day's marker dot."
              value={form.colors.node}
              onChange={(v) => setColor("node", v)}
              allowClear
            />
            <ColorField
              label="Node border color"
              help="Color of the ring around each marker dot — leave unset to match the page background (the default halo look)."
              value={form.colors.nodeBorder}
              onChange={(v) => setColor("nodeBorder", v)}
              allowClear
            />
            <ColorField
              label="Edge (line) color"
              help="Color of the connecting line between markers."
              value={form.colors.edge}
              onChange={(v) => setColor("edge", v)}
              allowClear
            />
            <ColorField
              label="Date chip background"
              help="Background color of the small pill showing each date."
              value={form.colors.dateChipBackground}
              onChange={(v) => setColor("dateChipBackground", v)}
              allowClear
            />
            <ColorField
              label="Date chip text"
              help="Text color of the small pill showing each date."
              value={form.colors.dateChipText}
              onChange={(v) => setColor("dateChipText", v)}
              allowClear
            />
          </div>
        </Section>

        <Section
          id="particles"
          icon={Sparkles}
          title="Particle effects"
          description="Optional animated particles drifting over the timeline page — sparkles, falling leaves, hearts, and more."
          collapsed={collapsed.particles}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Effect"
              help="Which particle drifts over the page. None disables the effect entirely."
              value={form.particleEffect}
              onChange={(e) => setForm({ ...form, particleEffect: e.target.value })}
            >
              {PARTICLE_EFFECTS.map((effect) => (
                <option key={effect} value={effect}>
                  {effect === "none" ? "None" : effect[0].toUpperCase() + effect.slice(1)}
                </option>
              ))}
            </Select>
            {form.particleEffect !== "none" && (
              <SliderField
                label="Particle count"
                help="How many particles are on screen at once. Higher looks fuller but costs more to render."
                value={form.particleCount}
                onChange={(v) => setForm({ ...form, particleCount: v })}
                min={5}
                max={60}
                unit=""
              />
            )}
          </div>
          {form.particleEffect !== "none" && (
            <>
              <SliderField
                label="Fall speed"
                help="Multiplier on how fast particles fall — 1x is the default, 3x is fast, 0.5x is slow and floaty."
                value={form.particleSpeed}
                onChange={(v) => setForm({ ...form, particleSpeed: v })}
                min={0.5}
                max={3}
                step={0.1}
                unit="x"
              />
              <div className="grid grid-cols-2 gap-4">
                <SliderField
                  label="Min size"
                  help="Smallest a particle can render at (the farthest, most distant-looking ones)."
                  value={form.particleMinSize}
                  onChange={(v) => setForm({ ...form, particleMinSize: v })}
                  min={4}
                  max={60}
                />
                <SliderField
                  label="Max size"
                  help="Largest a particle can render at (the nearest, closest-looking ones)."
                  value={form.particleMaxSize}
                  onChange={(v) => setForm({ ...form, particleMaxSize: v })}
                  min={4}
                  max={80}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Switch
                  checked={form.particleInteractive}
                  onChange={(v) => setForm({ ...form, particleInteractive: v })}
                  label="React to cursor / touch"
                />
                <FieldHelp text="Particles are gently pushed away from the visitor's cursor or finger instead of ignoring it — a light scatter-and-settle effect." />
              </div>
              {form.particleInteractive && (
                <SliderField
                  label="Sensitivity"
                  help="How far the cursor/touch reaches and how hard it scatters particles — 1x is the default, 3x is a big dramatic push, 0.5x is a subtle nudge."
                  value={form.particleInteractionStrength}
                  onChange={(v) => setForm({ ...form, particleInteractionStrength: v })}
                  min={0.5}
                  max={3}
                  step={0.1}
                  unit="x"
                />
              )}
            </>
          )}
        </Section>
      </div>
    </Modal>

    <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Theme preview" width="560px">
      <ThemePreview form={form} />
    </Modal>
    </>
  );
}
