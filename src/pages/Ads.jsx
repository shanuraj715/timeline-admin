import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Home, FileText, GalleryHorizontalEnd, LayoutDashboard, LogIn, UserPlus } from "lucide-react";
import { fetchAdSettings, updateAdSettings, fetchAdPlacements, updateAdPlacement } from "../api/ads";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Tabs } from "../components/ui/Tabs";
import { Input, Textarea, Select } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Switch } from "../components/ui/Switch";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../lib/permissions";
import { useToast } from "../context/ToastContext";

// Mirrors timeline-backend/src/models/AdPlacement.js's AD_SIZES export —
// keep both lists in sync if this ever changes.
const AD_SIZES = [
  "320x50",
  "320x100",
  "468x60",
  "300x250",
  "336x280",
  "728x90",
  "970x250",
  "160x600",
  "300x600",
  "responsive",
];

// Mirrors timeline-backend/src/models/AdPlacement.js's AD_GROUPS export
// (key + label) — one tab per page/page-group, plus an icon for the tab bar.
const GROUPS = [
  { key: "homepage", label: "Homepage", icon: Home },
  { key: "cms", label: "CMS pages", icon: FileText },
  { key: "timeline", label: "Timeline viewer", icon: GalleryHorizontalEnd },
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "login", label: "Login page", icon: LogIn },
  { key: "register", label: "Register page", icon: UserPlus },
];

const DEVICE_LABELS = { mobile: "Mobile", tablet: "Tablet", desktop: "Desktop" };

function deviceSummary(devices) {
  return ["mobile", "tablet", "desktop"]
    .map((tier) => {
      const d = devices?.[tier];
      const short = tier[0].toUpperCase();
      return d?.enabled ? `${short} ${d.size}` : `${short} off`;
    })
    .join(" · ");
}

export default function Ads() {
  const { user } = useAuth();
  if (!hasPermission(user, "ads")) {
    return <EmptyState title="No access" description="You don't have access to Ads." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text">Ads</h1>
        <p className="text-sm text-text-muted">
          Google AdSense placements shown across the site — homepage, CMS pages, the timeline viewer, dashboard, and
          login/register. Each placement's description below says exactly which page/spot it renders in.
        </p>
      </div>

      <AdSettingsCard />
      <PlacementsCard />
    </div>
  );
}

function AdSettingsCard() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: settings, isLoading } = useQuery({ queryKey: ["ad-settings"], queryFn: fetchAdSettings });

  const [adsEnabled, setAdsEnabled] = useState(false);
  const [publisherId, setPublisherId] = useState("");
  const [adBlockDetectionEnabled, setAdBlockDetectionEnabled] = useState(false);
  const [adBlockMessage, setAdBlockMessage] = useState("");

  useEffect(() => {
    if (!settings) return;
    setAdsEnabled(settings.adsEnabled);
    setPublisherId(settings.publisherId);
    setAdBlockDetectionEnabled(settings.adBlockDetectionEnabled);
    setAdBlockMessage(settings.adBlockMessage);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => updateAdSettings({ adsEnabled, publisherId, adBlockDetectionEnabled, adBlockMessage }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["ad-settings"], updated);
      toast("Ad settings saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  if (isLoading) return <div className="p-5 text-text-muted">Loading…</div>;

  return (
    <Card>
      <CardHeader
        title="Global settings"
        description="The master switch below turns every ad on this entire site on or off at once, regardless of what's enabled per placement below."
      />
      <CardBody className="flex flex-col gap-4">
        <Switch
          checked={adsEnabled}
          onChange={setAdsEnabled}
          label={adsEnabled ? "Ads are enabled sitewide" : "All ads are off, everywhere — master switch"}
        />
        <Input
          label="AdSense publisher ID"
          help="Your AdSense client ID, e.g. ca-pub-1234567890123456. Ads stay off until this is set, even if enabled above."
          value={publisherId}
          onChange={(e) => setPublisherId(e.target.value)}
          placeholder="ca-pub-1234567890123456"
        />
        <Switch
          checked={adBlockDetectionEnabled}
          onChange={setAdBlockDetectionEnabled}
          label={adBlockDetectionEnabled ? "Ad-blocker visitors are blocked from ad-bearing pages" : "Ad-blocker detection is off"}
        />
        <Textarea
          label="Ad-blocker message"
          help="Shown full-screen to a visitor with an ad blocker, on pages that carry an ad."
          rows={3}
          maxLength={500}
          value={adBlockMessage}
          onChange={(e) => setAdBlockMessage(e.target.value)}
        />
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="self-start">
          Save
        </Button>
      </CardBody>
    </Card>
  );
}

function PlacementsCard() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: placements = [], isLoading } = useQuery({ queryKey: ["ad-placements"], queryFn: fetchAdPlacements });

  const [editKey, setEditKey] = useState(null);
  const editing = placements.find((p) => p.key === editKey) || null;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["ad-placements"] });
  }

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }) => updateAdPlacement(key, { enabled }),
    onSuccess: invalidate,
    onError: (err) => toast(err.message, "error"),
  });

  const saveMutation = useMutation({
    mutationFn: ({ key, data }) => updateAdPlacement(key, data),
    onSuccess: () => {
      invalidate();
      setEditKey(null);
      toast("Placement saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <Card>
      <CardHeader
        title="Placements"
        description="A fixed set of ad slots wired into the site's pages, grouped by where they show — sizes/slot IDs/enabled state are editable here, but new placements can't be added without a matching code change."
      />
      {isLoading ? (
        <CardBody>Loading…</CardBody>
      ) : (
        <Tabs tabs={GROUPS} defaultTab={GROUPS[0].key}>
          {(active) => {
            const groupPlacements = placements.filter((p) => p.group === active);
            if (groupPlacements.length === 0) {
              return <EmptyState title="No placements" description="Nothing seeded for this group yet." />;
            }
            return (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Placement</Th>
                    <Th>Where it shows</Th>
                    <Th>Devices</Th>
                    <Th>Enabled</Th>
                    <Th />
                  </Tr>
                </Thead>
                <Tbody>
                  {groupPlacements.map((p) => (
                    <Tr key={p.key}>
                      <Td className="font-medium">{p.label}</Td>
                      <Td className="text-text-muted">{p.description}</Td>
                      <Td className="text-text-muted">{deviceSummary(p.devices)}</Td>
                      <Td>
                        <Switch
                          checked={p.enabled}
                          onChange={(enabled) => toggleMutation.mutate({ key: p.key, enabled })}
                        />
                      </Td>
                      <Td>
                        <div className="flex justify-end">
                          <IconButton label="Edit placement" icon={Pencil} onClick={() => setEditKey(p.key)} />
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            );
          }}
        </Tabs>
      )}

      {editing && (
        <AdPlacementModal
          placement={editing}
          onClose={() => setEditKey(null)}
          onSave={(data) => saveMutation.mutate({ key: editing.key, data })}
          saving={saveMutation.isPending}
        />
      )}
    </Card>
  );
}

function AdPlacementModal({ placement, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    label: placement.label,
    description: placement.description,
    enabled: placement.enabled,
    devices: {
      mobile: { ...placement.devices.mobile },
      tablet: { ...placement.devices.tablet },
      desktop: { ...placement.devices.desktop },
    },
  });

  function updateDevice(tier, patch) {
    setForm((f) => ({ ...f, devices: { ...f.devices, [tier]: { ...f.devices[tier], ...patch } } }));
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit placement — ${placement.key}`}
      width="640px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)} disabled={saving || !form.label}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="rounded-lg bg-surface-hover px-3 py-2 text-xs text-text-muted">{placement.description}</p>

        <Input label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <Textarea
          label="Description"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Switch
          checked={form.enabled}
          onChange={(enabled) => setForm({ ...form, enabled })}
          label={form.enabled ? "This placement is enabled" : "This placement is off, on every device"}
        />

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          {["mobile", "tablet", "desktop"].map((tier) => (
            <div key={tier} className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text">{DEVICE_LABELS[tier]}</span>
                <Switch
                  checked={form.devices[tier].enabled}
                  onChange={(enabled) => updateDevice(tier, { enabled })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Size"
                  value={form.devices[tier].size}
                  onChange={(e) => updateDevice(tier, { size: e.target.value })}
                >
                  {AD_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size === "responsive" ? "Responsive (auto)" : size}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Ad slot ID"
                  value={form.devices[tier].adSlotId}
                  onChange={(e) => updateDevice(tier, { adSlotId: e.target.value })}
                  placeholder="1234567890"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
