import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
import { fetchWhyChooseUs, updateWhyChooseUs } from "../api/whyChooseUs";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Input, Textarea, Select } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { ThemedImageField, ImageSlot } from "../components/ThemedImageField";
import { useToast } from "../context/ToastContext";

// Same 12-key allowlist as Homepage.jsx's ICON_OPTIONS — kept in lockstep
// with timeline-backend's lib/validation/whyChooseUsContent.js (WHY_ICONS)
// and the public frontend's icon-name -> lucide-component lookup in
// timeline/src/app/(public)/why-mytimelyne/page.jsx.
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
  seoTitle: "",
  seoDescription: "",
  hero: { eyebrow: "", heading: "", subheading: "", imageUrlLight: "", imageUrlDark: "" },
  reasonsHeading: "",
  reasonsSubheading: "",
  reasons: [],
  couplesHeading: "",
  couplesSubheading: "",
  couplesReasons: [],
  comparisonHeading: "",
  comparisonSubheading: "",
  comparisonUsLabel: "MyTimelyne",
  competitors: [],
  comparisonRows: [],
  securityHeading: "",
  securitySubheading: "",
  securityItems: [],
  storageHeading: "",
  storageSubheading: "",
  storageItems: [],
  privacyHeading: "",
  privacySubheading: "",
  privacyItems: [],
  pricingHeading: "",
  pricingSubheading: "",
  pricingItems: [],
  familyHeading: "",
  familySubheading: "",
  familyItems: [],
  cta: { heading: "", subheading: "", buttonLabel: "", buttonUrl: "" },
};

function moveItem(list, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = list.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function WhyChooseUs() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["why-choose-us-content"], queryFn: fetchWhyChooseUs });
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!data) return;
    setForm({
      seoTitle: data.seoTitle || "",
      seoDescription: data.seoDescription || "",
      hero: { ...EMPTY_FORM.hero, ...data.hero },
      reasonsHeading: data.reasonsHeading || "",
      reasonsSubheading: data.reasonsSubheading || "",
      reasons: data.reasons || [],
      couplesHeading: data.couplesHeading || "",
      couplesSubheading: data.couplesSubheading || "",
      couplesReasons: data.couplesReasons || [],
      comparisonHeading: data.comparisonHeading || "",
      comparisonSubheading: data.comparisonSubheading || "",
      comparisonUsLabel: data.comparisonUsLabel || "MyTimelyne",
      competitors: data.competitors || [],
      comparisonRows: data.comparisonRows || [],
      securityHeading: data.securityHeading || "",
      securitySubheading: data.securitySubheading || "",
      securityItems: data.securityItems || [],
      storageHeading: data.storageHeading || "",
      storageSubheading: data.storageSubheading || "",
      storageItems: data.storageItems || [],
      privacyHeading: data.privacyHeading || "",
      privacySubheading: data.privacySubheading || "",
      privacyItems: data.privacyItems || [],
      pricingHeading: data.pricingHeading || "",
      pricingSubheading: data.pricingSubheading || "",
      pricingItems: data.pricingItems || [],
      familyHeading: data.familyHeading || "",
      familySubheading: data.familySubheading || "",
      familyItems: data.familyItems || [],
      cta: { ...EMPTY_FORM.cta, ...data.cta },
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => updateWhyChooseUs(form),
    onSuccess: (updated) => {
      queryClient.setQueryData(["why-choose-us-content"], updated);
      toast("Why MyTimelyne page saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  function setHero(key, value) {
    setForm((f) => ({ ...f, hero: { ...f.hero, [key]: value } }));
  }

  function setCta(key, value) {
    setForm((f) => ({ ...f, cta: { ...f.cta, [key]: value } }));
  }

  // ---- Comparison: competitors (columns) ----
  function setCompetitor(index, key, value) {
    setForm((f) => ({ ...f, competitors: f.competitors.map((c, i) => (i === index ? { ...c, [key]: value } : c)) }));
  }
  function addCompetitor() {
    setForm((f) => ({
      ...f,
      competitors: [...f.competitors, { name: "", logoUrl: "" }],
      // Every existing row gains a matching blank value so competitors and
      // each row's competitorValues never drift out of sync.
      comparisonRows: f.comparisonRows.map((row) => ({ ...row, competitorValues: [...row.competitorValues, ""] })),
    }));
  }
  function removeCompetitor(index) {
    setForm((f) => ({
      ...f,
      competitors: f.competitors.filter((_, i) => i !== index),
      comparisonRows: f.comparisonRows.map((row) => ({
        ...row,
        competitorValues: row.competitorValues.filter((_, i) => i !== index),
      })),
    }));
  }

  // ---- Comparison: rows ----
  function setComparisonRow(index, key, value) {
    setForm((f) => ({
      ...f,
      comparisonRows: f.comparisonRows.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));
  }
  function setComparisonRowValue(rowIndex, competitorIndex, value) {
    setForm((f) => ({
      ...f,
      comparisonRows: f.comparisonRows.map((row, i) =>
        i === rowIndex
          ? { ...row, competitorValues: row.competitorValues.map((v, ci) => (ci === competitorIndex ? value : v)) }
          : row
      ),
    }));
  }
  function addComparisonRow() {
    setForm((f) => ({
      ...f,
      comparisonRows: [...f.comparisonRows, { label: "", usValue: "", competitorValues: f.competitors.map(() => "") }],
    }));
  }
  function removeComparisonRow(index) {
    setForm((f) => ({ ...f, comparisonRows: f.comparisonRows.filter((_, i) => i !== index) }));
  }
  function reorderComparisonRow(index, direction) {
    setForm((f) => ({ ...f, comparisonRows: moveItem(f.comparisonRows, index, direction) }));
  }

  if (isLoading) return <div className="p-5 text-text-muted">Loading…</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Why MyTimelyne</h1>
          <p className="text-sm text-text-muted">
            Content shown on the public "/why-mytimelyne" page. Changes go live immediately.
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
            help="Small label above the heading, e.g. 'Why MyTimelyne'."
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
            help="Optional. Leave empty for a text-only hero."
            lightValue={form.hero.imageUrlLight}
            onLightChange={(url) => setHero("imageUrlLight", url)}
            darkValue={form.hero.imageUrlDark}
            onDarkChange={(url) => setHero("imageUrlDark", url)}
          />
        </CardBody>
      </Card>

      <ReasonsCard
        title="Reasons to choose us"
        description="Up to 8 cards. Each has an icon (or an image, which overrides the icon), a title, and a short description."
        itemLabel="Reason"
        headingValue={form.reasonsHeading}
        onHeadingChange={(v) => setForm((f) => ({ ...f, reasonsHeading: v }))}
        subheadingValue={form.reasonsSubheading}
        onSubheadingChange={(v) => setForm((f) => ({ ...f, reasonsSubheading: v }))}
        items={form.reasons}
        onItemsChange={(items) => setForm((f) => ({ ...f, reasons: items }))}
      />

      <ReasonsCard
        title="Why couples choose us"
        description="Up to 8 cards, same shape as above — for couples keeping a shared timeline together, rather than a whole family."
        itemLabel="Reason"
        headingValue={form.couplesHeading}
        onHeadingChange={(v) => setForm((f) => ({ ...f, couplesHeading: v }))}
        subheadingValue={form.couplesSubheading}
        onSubheadingChange={(v) => setForm((f) => ({ ...f, couplesSubheading: v }))}
        items={form.couplesReasons}
        onItemsChange={(items) => setForm((f) => ({ ...f, couplesReasons: items }))}
      />

      <Card>
        <CardHeader
          title="Compare us"
          description="Up to 4 competitor columns and 10 feature rows. The 'Us' value is always shown first; each row needs exactly one value per competitor — adding/removing a competitor keeps every row in sync automatically."
        />
        <CardBody className="flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Section heading"
              value={form.comparisonHeading}
              onChange={(e) => setForm((f) => ({ ...f, comparisonHeading: e.target.value }))}
            />
            <Input
              label="Section subheading"
              value={form.comparisonSubheading}
              onChange={(e) => setForm((f) => ({ ...f, comparisonSubheading: e.target.value }))}
            />
            <Input
              label="'Us' column label"
              value={form.comparisonUsLabel}
              onChange={(e) => setForm((f) => ({ ...f, comparisonUsLabel: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-text">Competitors</span>
            <div className="flex flex-wrap gap-3">
              {form.competitors.map((competitor, index) => (
                <div key={index} className="flex w-64 flex-col gap-2 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-muted">Competitor {index + 1}</span>
                    <IconButton
                      label="Remove competitor"
                      icon={X}
                      variant="danger"
                      onClick={() => removeCompetitor(index)}
                    />
                  </div>
                  <Input
                    label="Name"
                    value={competitor.name}
                    onChange={(e) => setCompetitor(index, "name", e.target.value)}
                  />
                  <ImageSlot
                    label="Logo"
                    value={competitor.logoUrl}
                    onChange={(url) => setCompetitor(index, "logoUrl", url)}
                    onRemove={() => setCompetitor(index, "logoUrl", "")}
                  />
                </div>
              ))}
            </div>
            {form.competitors.length < 4 && (
              <Button variant="secondary" className="self-start" onClick={addCompetitor}>
                <Plus size={16} /> Add competitor
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-text">Feature rows</span>
            {form.comparisonRows.map((row, index) => (
              <div key={index} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted">Row {index + 1}</span>
                  <div className="flex gap-1">
                    <IconButton
                      label="Move up"
                      icon={ChevronUp}
                      disabled={index === 0}
                      onClick={() => reorderComparisonRow(index, -1)}
                    />
                    <IconButton
                      label="Move down"
                      icon={ChevronDown}
                      disabled={index === form.comparisonRows.length - 1}
                      onClick={() => reorderComparisonRow(index, 1)}
                    />
                    <IconButton
                      label="Remove row"
                      icon={Trash2}
                      variant="danger"
                      onClick={() => removeComparisonRow(index)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Feature label"
                    value={row.label}
                    onChange={(e) => setComparisonRow(index, "label", e.target.value)}
                  />
                  <Input
                    label={`${form.comparisonUsLabel || "Us"} value`}
                    help="'Yes' or 'No' renders as a check/cross icon; anything else (e.g. '15GB free') renders as plain text."
                    value={row.usValue}
                    onChange={(e) => setComparisonRow(index, "usValue", e.target.value)}
                  />
                </div>
                {form.competitors.length > 0 && (
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${form.competitors.length}, 1fr)` }}>
                    {form.competitors.map((competitor, ci) => (
                      <Input
                        key={ci}
                        label={competitor.name || `Competitor ${ci + 1}`}
                        value={row.competitorValues[ci] || ""}
                        onChange={(e) => setComparisonRowValue(index, ci, e.target.value)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {form.comparisonRows.length < 10 && (
              <Button variant="secondary" className="self-start" onClick={addComparisonRow}>
                <Plus size={16} /> Add row
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <FaqCard
        title="Security"
        description="Up to 8 simple-language Q&A pairs, e.g. 'Is my data private?'"
        headingValue={form.securityHeading}
        onHeadingChange={(v) => setForm((f) => ({ ...f, securityHeading: v }))}
        subheadingValue={form.securitySubheading}
        onSubheadingChange={(v) => setForm((f) => ({ ...f, securitySubheading: v }))}
        items={form.securityItems}
        onItemsChange={(items) => setForm((f) => ({ ...f, securityItems: items }))}
      />

      <FaqCard
        title="Storage"
        description="Up to 8 simple-language Q&A pairs, e.g. 'How much storage do I get?'"
        headingValue={form.storageHeading}
        onHeadingChange={(v) => setForm((f) => ({ ...f, storageHeading: v }))}
        subheadingValue={form.storageSubheading}
        onSubheadingChange={(v) => setForm((f) => ({ ...f, storageSubheading: v }))}
        items={form.storageItems}
        onItemsChange={(items) => setForm((f) => ({ ...f, storageItems: items }))}
      />

      <FaqCard
        title="Privacy"
        description="Up to 8 simple-language Q&A pairs, e.g. 'Who can see my timeline?'"
        headingValue={form.privacyHeading}
        onHeadingChange={(v) => setForm((f) => ({ ...f, privacyHeading: v }))}
        subheadingValue={form.privacySubheading}
        onSubheadingChange={(v) => setForm((f) => ({ ...f, privacySubheading: v }))}
        items={form.privacyItems}
        onItemsChange={(items) => setForm((f) => ({ ...f, privacyItems: items }))}
      />

      <FaqCard
        title="Pricing & billing"
        description="Up to 8 simple-language Q&A pairs, e.g. 'What's included in the free plan?'"
        headingValue={form.pricingHeading}
        onHeadingChange={(v) => setForm((f) => ({ ...f, pricingHeading: v }))}
        subheadingValue={form.pricingSubheading}
        onSubheadingChange={(v) => setForm((f) => ({ ...f, pricingSubheading: v }))}
        items={form.pricingItems}
        onItemsChange={(items) => setForm((f) => ({ ...f, pricingItems: items }))}
      />

      <FaqCard
        title="Family & sharing"
        description="Up to 8 simple-language Q&A pairs, e.g. 'How many people can join a timeline?'"
        headingValue={form.familyHeading}
        onHeadingChange={(v) => setForm((f) => ({ ...f, familyHeading: v }))}
        subheadingValue={form.familySubheading}
        onSubheadingChange={(v) => setForm((f) => ({ ...f, familySubheading: v }))}
        items={form.familyItems}
        onItemsChange={(items) => setForm((f) => ({ ...f, familyItems: items }))}
      />

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

// Shared by "Reasons to choose us" and "Why couples choose us" — both are
// the exact same icon/title/description(/image) card array shape, just
// stored under different keys and shown as their own page section.
function ReasonsCard({
  title,
  description,
  itemLabel,
  headingValue,
  onHeadingChange,
  subheadingValue,
  onSubheadingChange,
  items,
  onItemsChange,
}) {
  function setItem(index, key, value) {
    onItemsChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }
  function addItem() {
    onItemsChange([...items, { icon: "sparkles", title: "", description: "", imageUrlLight: "", imageUrlDark: "" }]);
  }
  function removeItem(index) {
    onItemsChange(items.filter((_, i) => i !== index));
  }
  function reorderItem(index, direction) {
    onItemsChange(moveItem(items, index, direction));
  }

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Section heading" value={headingValue} onChange={(e) => onHeadingChange(e.target.value)} />
          <Input label="Section subheading" value={subheadingValue} onChange={(e) => onSubheadingChange(e.target.value)} />
        </div>
        {items.map((item, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">
                {itemLabel} {index + 1}
              </span>
              <div className="flex gap-1">
                <IconButton label="Move up" icon={ChevronUp} disabled={index === 0} onClick={() => reorderItem(index, -1)} />
                <IconButton
                  label="Move down"
                  icon={ChevronDown}
                  disabled={index === items.length - 1}
                  onClick={() => reorderItem(index, 1)}
                />
                <IconButton label={`Remove ${itemLabel.toLowerCase()}`} icon={Trash2} variant="danger" onClick={() => removeItem(index)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Icon" value={item.icon} onChange={(e) => setItem(index, "icon", e.target.value)}>
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              <Input label="Title" value={item.title} onChange={(e) => setItem(index, "title", e.target.value)} />
            </div>
            <Textarea
              label="Description"
              rows={2}
              value={item.description}
              onChange={(e) => setItem(index, "description", e.target.value)}
            />
            <ThemedImageField
              label="Image (optional)"
              help="Overrides the icon above when set."
              lightValue={item.imageUrlLight}
              onLightChange={(url) => setItem(index, "imageUrlLight", url)}
              darkValue={item.imageUrlDark}
              onDarkChange={(url) => setItem(index, "imageUrlDark", url)}
            />
          </div>
        ))}
        {items.length < 8 && (
          <Button variant="secondary" className="self-start" onClick={addItem}>
            <Plus size={16} /> Add {itemLabel.toLowerCase()}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}

// Shared by the Security and Storage cards — both are the exact same
// question/answer array shape, just stored under different keys.
function FaqCard({ title, description, headingValue, onHeadingChange, subheadingValue, onSubheadingChange, items, onItemsChange }) {
  function setItem(index, key, value) {
    onItemsChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }
  function addItem() {
    onItemsChange([...items, { question: "", answer: "" }]);
  }
  function removeItem(index) {
    onItemsChange(items.filter((_, i) => i !== index));
  }
  function reorderItem(index, direction) {
    onItemsChange(moveItem(items, index, direction));
  }

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Section heading" value={headingValue} onChange={(e) => onHeadingChange(e.target.value)} />
          <Input label="Section subheading" value={subheadingValue} onChange={(e) => onSubheadingChange(e.target.value)} />
        </div>
        {items.map((item, index) => (
          <div key={index} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Item {index + 1}</span>
              <div className="flex gap-1">
                <IconButton label="Move up" icon={ChevronUp} disabled={index === 0} onClick={() => reorderItem(index, -1)} />
                <IconButton
                  label="Move down"
                  icon={ChevronDown}
                  disabled={index === items.length - 1}
                  onClick={() => reorderItem(index, 1)}
                />
                <IconButton label="Remove item" icon={Trash2} variant="danger" onClick={() => removeItem(index)} />
              </div>
            </div>
            <Input label="Question" value={item.question} onChange={(e) => setItem(index, "question", e.target.value)} />
            <Textarea label="Answer" rows={2} value={item.answer} onChange={(e) => setItem(index, "answer", e.target.value)} />
          </div>
        ))}
        {items.length < 8 && (
          <Button variant="secondary" className="self-start" onClick={addItem}>
            <Plus size={16} /> Add item
          </Button>
        )}
      </CardBody>
    </Card>
  );
}
