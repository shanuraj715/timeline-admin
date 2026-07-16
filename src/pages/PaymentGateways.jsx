import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchGateways, saveGateway } from "../api/billing";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Switch } from "../components/ui/Switch";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../context/ToastContext";
import { confirmSecretClear } from "../lib/confirmSecretClear";

const PROVIDERS = [
  {
    key: "razorpay",
    label: "Razorpay",
    description: "Cards, UPI, netbanking, wallets via Razorpay Checkout.",
    credentialFields: [
      { key: "keyId", label: "Key ID" },
      { key: "keySecret", label: "Key secret" },
      {
        key: "webhookSecret",
        label: "Webhook secret (optional)",
        hint: "Not required for checkout — only needed if you set up a webhook in your Razorpay dashboard for automatic payment confirmation. Leave blank otherwise.",
      },
    ],
  },
  {
    key: "phonepe",
    label: "PhonePe",
    description: "PhonePe payment gateway. Checkout integration is not wired up yet — configuring it here does not process payments.",
    credentialFields: [
      { key: "merchantId", label: "Merchant ID" },
      { key: "saltKey", label: "Salt key" },
    ],
  },
  {
    key: "upi",
    label: "UPI (direct)",
    description: "Direct UPI ID for manual/QR-based payments. Checkout integration is not wired up yet.",
    credentialFields: [{ key: "vpa", label: "UPI ID (VPA)" }],
  },
  {
    key: "mock",
    label: "Test / Mock",
    description: "Simulates a successful payment with no real money — useful for testing the buy-credits flow.",
    credentialFields: [],
  },
];

export default function PaymentGateways() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: gateways = [], isLoading } = useQuery({ queryKey: ["gateways"], queryFn: fetchGateways });

  const saveMutation = useMutation({
    mutationFn: ({ provider, data }) => saveGateway(provider, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateways"] });
      toast("Gateway saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  if (isLoading) return <div className="text-text-muted">Loading…</div>;

  const byProvider = Object.fromEntries(gateways.map((g) => [g.provider, g]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text">Payment gateways</h1>
        <p className="text-sm text-text-muted">
          Only enabled gateways are offered to users on the public pricing page.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {PROVIDERS.map((provider) => (
          <GatewayCard
            key={provider.key}
            provider={provider}
            gateway={byProvider[provider.key]}
            onSave={(data) => saveMutation.mutate({ provider: provider.key, data })}
            saving={saveMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function GatewayCard({ provider, gateway, onSave, saving }) {
  const [form, setForm] = useState({
    isEnabled: gateway?.isEnabled || false,
    isDefault: gateway?.isDefault || false,
    mode: gateway?.mode || "test",
    credentials: Object.fromEntries(provider.credentialFields.map((f) => [f.key, gateway?.credentials?.[f.key] || ""])),
    config: gateway?.config || {},
  });

  function setCredential(key, value) {
    setForm((f) => ({ ...f, credentials: { ...f.credentials, [key]: value } }));
  }

  const dirty = JSON.stringify(form) !== JSON.stringify({
    isEnabled: gateway?.isEnabled || false,
    isDefault: gateway?.isDefault || false,
    mode: gateway?.mode || "test",
    credentials: Object.fromEntries(provider.credentialFields.map((f) => [f.key, gateway?.credentials?.[f.key] || ""])),
    config: gateway?.config || {},
  });

  function handleSave() {
    const ok = confirmSecretClear(
      provider.credentialFields.map((f) => ({
        label: f.label,
        hadValue: Boolean(gateway?.credentials?.[f.key]),
        isEmpty: !form.credentials[f.key],
      }))
    );
    if (ok) onSave(form);
  }

  return (
    <Card>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            {provider.label}
            {gateway?.isEnabled && <Badge tone="success">Enabled</Badge>}
            {gateway?.isDefault && <Badge tone="primary">Default</Badge>}
          </div>
        }
        description={provider.description}
        actions={<Switch checked={form.isEnabled} onChange={(v) => setForm({ ...form, isEnabled: v })} />}
      />
      <CardBody className="flex flex-col gap-4">
        {provider.credentialFields.length > 0 && (
          <>
            <Select label="Mode" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
              <option value="test">Test</option>
              <option value="live">Live</option>
            </Select>
            {provider.credentialFields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1">
                <Input
                  label={field.label}
                  value={form.credentials[field.key]}
                  onChange={(e) => setCredential(field.key, e.target.value)}
                  placeholder={field.key.toLowerCase().includes("secret") || field.key === "saltKey" ? "••••••••" : ""}
                />
                {field.hint && <p className="text-xs text-text-muted">{field.hint}</p>}
              </div>
            ))}
          </>
        )}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <Switch
            checked={form.isDefault}
            onChange={(v) => setForm({ ...form, isDefault: v })}
            label="Default gateway"
          />
          <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
            Save
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
