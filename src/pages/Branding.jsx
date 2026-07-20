import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBranding, updateBranding } from "../api/branding";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Input, Textarea, Select } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Switch } from "../components/ui/Switch";
import { ThemedImageField } from "../components/ThemedImageField";
import { useToast } from "../context/ToastContext";

const EMPTY_FORM = {
  siteName: "Timeline",
  logoMode: "text",
  logoImageLight: "",
  logoImageDark: "",
  logoImageHeight: 32,
  footerTagline: "",
  footerLogoMode: "text",
  footerLogoImageLight: "",
  footerLogoImageDark: "",
  footerLogoImageHeight: 32,
  footerAlign: "left",
};

// Shared by the header and footer logo sections below — identical control,
// just bound to a different pair of form keys.
function LogoHeightSlider({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center justify-between text-sm font-medium text-text">
        <span>Logo height</span>
        <span className="font-normal text-text-muted">{value}px</span>
      </label>
      <input
        type="range"
        min={16}
        max={120}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <span className="text-xs text-text-muted">Width scales automatically to match the image's own proportions.</span>
    </div>
  );
}

export default function Branding() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["branding"], queryFn: fetchBranding });
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!data) return;
    setForm({ ...EMPTY_FORM, ...data });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => updateBranding(form),
    onSuccess: (updated) => {
      queryClient.setQueryData(["branding"], updated);
      toast("Branding saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  if (isLoading) return <div className="p-5 text-text-muted">Loading…</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Branding</h1>
          <p className="text-sm text-text-muted">
            The site's logo, header, and footer — shown across the whole app, not just the public site. Changes go
            live immediately.
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          Save
        </Button>
      </div>

      <Card>
        <CardHeader title="Site name" description="Used as the text logo (unless an image is uploaded below) and in the footer's copyright line." />
        <CardBody>
          <Input value={form.siteName} onChange={(e) => set("siteName", e.target.value)} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Header logo"
          description="Shown in the header and everywhere else the logo appears (dashboard, login, etc.). Choose between the default icon + site name, or your own uploaded image."
        />
        <CardBody className="flex flex-col gap-4">
          <Switch
            checked={form.logoMode === "image"}
            onChange={(v) => set("logoMode", v ? "image" : "text")}
            label={form.logoMode === "image" ? "Using an uploaded image" : "Using icon + site name"}
          />
          {form.logoMode === "image" && (
            <>
              <ThemedImageField
                lightValue={form.logoImageLight}
                onLightChange={(url) => set("logoImageLight", url)}
                darkValue={form.logoImageDark}
                onDarkChange={(url) => set("logoImageDark", url)}
              />
              <LogoHeightSlider value={form.logoImageHeight} onChange={(v) => set("logoImageHeight", v)} />
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Footer"
          description="Independent from the header logo above — the footer can use its own image, and its brand block (logo + tagline) can be aligned separately from the rest of the footer's columns."
        />
        <CardBody className="flex flex-col gap-4">
          <Switch
            checked={form.footerLogoMode === "image"}
            onChange={(v) => set("footerLogoMode", v ? "image" : "text")}
            label={form.footerLogoMode === "image" ? "Using an uploaded image" : "Using icon + site name"}
          />
          {form.footerLogoMode === "image" && (
            <>
              <ThemedImageField
                lightValue={form.footerLogoImageLight}
                onLightChange={(url) => set("footerLogoImageLight", url)}
                darkValue={form.footerLogoImageDark}
                onDarkChange={(url) => set("footerLogoImageDark", url)}
              />
              <LogoHeightSlider value={form.footerLogoImageHeight} onChange={(v) => set("footerLogoImageHeight", v)} />
            </>
          )}
          <Select label="Alignment" value={form.footerAlign} onChange={(e) => set("footerAlign", e.target.value)}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </Select>
          <Textarea
            label="Tagline"
            help="Shown under the logo."
            rows={2}
            value={form.footerTagline}
            onChange={(e) => set("footerTagline", e.target.value)}
          />
        </CardBody>
      </Card>
    </div>
  );
}
