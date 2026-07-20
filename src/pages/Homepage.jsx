import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { fetchHomepage, updateHomepage } from "../api/homepage";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Input, Textarea, Select } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { ThemedImageField } from "../components/ThemedImageField";
import { useToast } from "../context/ToastContext";

// Fixed allowlist — kept in lockstep with timeline-backend's
// lib/validation/homepageContent.js (HOMEPAGE_ICONS) and the public
// frontend's icon-name -> lucide-component lookup in
// timeline/src/app/(public)/page.jsx.
const ICON_OPTIONS = [
  { key: "sparkles", label: "Sparkles" },
  { key: "shield", label: "Shield" },
  { key: "clock", label: "Clock" },
  { key: "users", label: "Users" },
  { key: "heart", label: "Heart" },
  { key: "globe", label: "Globe" },
  { key: "zap", label: "Zap" },
  { key: "layers", label: "Layers" },
  { key: "lock", label: "Lock" },
  { key: "camera", label: "Camera" },
  { key: "cloud", label: "Cloud" },
  { key: "infinity", label: "Infinity" },
];

const EMPTY_FORM = {
  hero: {
    eyebrow: "",
    heading: "",
    subheading: "",
    primaryCtaLabel: "",
    primaryCtaUrl: "",
    secondaryCtaLabel: "",
    secondaryCtaUrl: "",
    imageUrlLight: "",
    imageUrlDark: "",
  },
  features: [],
  stats: [],
  cta: { heading: "", subheading: "", buttonLabel: "", buttonUrl: "" },
  seoTitle: "",
  seoDescription: "",
};

function moveItem(list, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = list.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function Homepage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["homepage-content"], queryFn: fetchHomepage });
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!data) return;
    setForm({
      hero: { ...EMPTY_FORM.hero, ...data.hero },
      features: data.features || [],
      stats: data.stats || [],
      cta: { ...EMPTY_FORM.cta, ...data.cta },
      seoTitle: data.seoTitle || "",
      seoDescription: data.seoDescription || "",
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => updateHomepage(form),
    onSuccess: (updated) => {
      queryClient.setQueryData(["homepage-content"], updated);
      toast("Homepage saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  function setHero(key, value) {
    setForm((f) => ({ ...f, hero: { ...f.hero, [key]: value } }));
  }

  function setCta(key, value) {
    setForm((f) => ({ ...f, cta: { ...f.cta, [key]: value } }));
  }

  function setFeature(index, key, value) {
    setForm((f) => ({
      ...f,
      features: f.features.map((feat, i) => (i === index ? { ...feat, [key]: value } : feat)),
    }));
  }

  function addFeature() {
    setForm((f) => ({
      ...f,
      features: [...f.features, { icon: "sparkles", title: "", description: "", imageUrlLight: "", imageUrlDark: "" }],
    }));
  }

  function removeFeature(index) {
    setForm((f) => ({ ...f, features: f.features.filter((_, i) => i !== index) }));
  }

  function reorderFeature(index, direction) {
    setForm((f) => ({ ...f, features: moveItem(f.features, index, direction) }));
  }

  function setStat(index, key, value) {
    setForm((f) => ({ ...f, stats: f.stats.map((stat, i) => (i === index ? { ...stat, [key]: value } : stat)) }));
  }

  function addStat() {
    setForm((f) => ({ ...f, stats: [...f.stats, { value: "", label: "" }] }));
  }

  function removeStat(index) {
    setForm((f) => ({ ...f, stats: f.stats.filter((_, i) => i !== index) }));
  }

  function reorderStat(index, direction) {
    setForm((f) => ({ ...f, stats: moveItem(f.stats, index, direction) }));
  }

  if (isLoading) return <div className="p-5 text-text-muted">Loading…</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Homepage</h1>
          <p className="text-sm text-text-muted">
            Content shown on the public homepage at "/" for logged-out visitors. Changes go live immediately.
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          Save
        </Button>
      </div>

      <Card>
        <CardHeader title="Hero" description="The first thing a visitor sees." />
        <CardBody className="flex flex-col gap-4">
          <Input
            label="Eyebrow"
            help="Small label above the heading, e.g. 'New' or 'For families'."
            value={form.hero.eyebrow}
            onChange={(e) => setHero("eyebrow", e.target.value)}
          />
          <Input label="Heading" value={form.hero.heading} onChange={(e) => setHero("heading", e.target.value)} />
          <Textarea
            label="Subheading"
            rows={2}
            value={form.hero.subheading}
            onChange={(e) => setHero("subheading", e.target.value)}
          />
          <ThemedImageField
            label="Hero image"
            help="Optional. Shown beside the hero heading in a glass-framed panel. Leave empty for a text-only hero."
            lightValue={form.hero.imageUrlLight}
            onLightChange={(url) => setHero("imageUrlLight", url)}
            darkValue={form.hero.imageUrlDark}
            onDarkChange={(url) => setHero("imageUrlDark", url)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Primary button label"
              value={form.hero.primaryCtaLabel}
              onChange={(e) => setHero("primaryCtaLabel", e.target.value)}
            />
            <Input
              label="Primary button link"
              placeholder="/register"
              value={form.hero.primaryCtaUrl}
              onChange={(e) => setHero("primaryCtaUrl", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Secondary button label"
              value={form.hero.secondaryCtaLabel}
              onChange={(e) => setHero("secondaryCtaLabel", e.target.value)}
            />
            <Input
              label="Secondary button link"
              placeholder="/pricing"
              value={form.hero.secondaryCtaUrl}
              onChange={(e) => setHero("secondaryCtaUrl", e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Features" description="Up to 8 cards. Each has an icon, a title, and a short description." />
        <CardBody className="flex flex-col gap-4">
          {form.features.map((feature, index) => (
            <div key={index} className="flex flex-col gap-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">Feature {index + 1}</span>
                <div className="flex gap-1">
                  <IconButton
                    label="Move up"
                    icon={ChevronUp}
                    disabled={index === 0}
                    onClick={() => reorderFeature(index, -1)}
                  />
                  <IconButton
                    label="Move down"
                    icon={ChevronDown}
                    disabled={index === form.features.length - 1}
                    onClick={() => reorderFeature(index, 1)}
                  />
                  <IconButton label="Remove feature" icon={Trash2} variant="danger" onClick={() => removeFeature(index)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Icon" value={feature.icon} onChange={(e) => setFeature(index, "icon", e.target.value)}>
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                <Input label="Title" value={feature.title} onChange={(e) => setFeature(index, "title", e.target.value)} />
              </div>
              <Textarea
                label="Description"
                rows={2}
                value={feature.description}
                onChange={(e) => setFeature(index, "description", e.target.value)}
              />
              <ThemedImageField
                label="Image (optional)"
                help="Overrides the icon above when set."
                lightValue={feature.imageUrlLight}
                onLightChange={(url) => setFeature(index, "imageUrlLight", url)}
                darkValue={feature.imageUrlDark}
                onDarkChange={(url) => setFeature(index, "imageUrlDark", url)}
              />
            </div>
          ))}
          {form.features.length < 8 && (
            <Button variant="secondary" className="self-start" onClick={addFeature}>
              <Plus size={16} /> Add feature
            </Button>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Stats" description="Up to 6 small number+label pairs, e.g. '10k+' / 'Timelines created'." />
        <CardBody className="flex flex-col gap-3">
          {form.stats.map((stat, index) => (
            <div key={index} className="flex items-end gap-3">
              <Input
                label="Value"
                className="w-32"
                value={stat.value}
                onChange={(e) => setStat(index, "value", e.target.value)}
              />
              <Input
                label="Label"
                className="flex-1"
                value={stat.label}
                onChange={(e) => setStat(index, "label", e.target.value)}
              />
              <IconButton
                label="Move up"
                icon={ChevronUp}
                disabled={index === 0}
                onClick={() => reorderStat(index, -1)}
              />
              <IconButton
                label="Move down"
                icon={ChevronDown}
                disabled={index === form.stats.length - 1}
                onClick={() => reorderStat(index, 1)}
              />
              <IconButton label="Remove stat" icon={Trash2} variant="danger" onClick={() => removeStat(index)} />
            </div>
          ))}
          {form.stats.length < 6 && (
            <Button variant="secondary" className="self-start" onClick={addStat}>
              <Plus size={16} /> Add stat
            </Button>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Closing call to action" description="The final band at the bottom of the page." />
        <CardBody className="flex flex-col gap-4">
          <Input label="Heading" value={form.cta.heading} onChange={(e) => setCta("heading", e.target.value)} />
          <Textarea
            label="Subheading"
            rows={2}
            value={form.cta.subheading}
            onChange={(e) => setCta("subheading", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Button label" value={form.cta.buttonLabel} onChange={(e) => setCta("buttonLabel", e.target.value)} />
            <Input
              label="Button link"
              placeholder="/register"
              value={form.cta.buttonUrl}
              onChange={(e) => setCta("buttonUrl", e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="SEO" description="Shown in search results and social previews." />
        <CardBody className="flex flex-col gap-4">
          <Input
            label="SEO title"
            help="Falls back to a default title if left blank."
            value={form.seoTitle}
            onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
          />
          <Textarea
            label="SEO description"
            rows={2}
            help="Falls back to a default description if left blank."
            value={form.seoDescription}
            onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
          />
        </CardBody>
      </Card>
    </div>
  );
}
