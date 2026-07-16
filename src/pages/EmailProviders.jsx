import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEmailProviders, saveEmailProvider } from "../api/emailProviders";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Switch } from "../components/ui/Switch";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../context/ToastContext";

const COMMON_CONFIG_FIELDS = [
  { key: "fromEmail", label: "From email" },
  { key: "fromName", label: "From name" },
];

// Mirrors PaymentGateways.jsx's fixed-provider-card pattern exactly — these
// are a known enum (see EmailProvider.js's `provider` enum), not a
// user-creatable list, so a table+modal would be the wrong shape here.
const PROVIDERS = [
  {
    key: "sendgrid",
    label: "SendGrid",
    description: "Sends via SendGrid's Mail Send API.",
    credentialFields: [{ key: "apiKey", label: "API key" }],
    configFields: COMMON_CONFIG_FIELDS,
  },
  {
    key: "sendpulse",
    label: "SendPulse",
    description: "Sends via SendPulse's SMTP-via-API product (OAuth2 client credentials).",
    credentialFields: [
      { key: "clientId", label: "Client ID" },
      { key: "clientSecret", label: "Client secret" },
    ],
    configFields: COMMON_CONFIG_FIELDS,
  },
  {
    key: "resend",
    label: "Resend",
    description: "Sends via Resend's Send Email API.",
    credentialFields: [{ key: "apiKey", label: "API key" }],
    configFields: COMMON_CONFIG_FIELDS,
  },
  {
    key: "smtp",
    label: "SMTP",
    description: "Generic SMTP — works with Mailgun, Postmark, Gmail, Amazon SES, or a self-hosted relay.",
    credentialFields: [
      { key: "username", label: "Username" },
      { key: "password", label: "Password" },
    ],
    configFields: [
      { key: "host", label: "Host" },
      { key: "port", label: "Port" },
      ...COMMON_CONFIG_FIELDS,
    ],
    hasSecureToggle: true,
  },
];

export default function EmailProviders() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: providers = [], isLoading } = useQuery({ queryKey: ["email-providers"], queryFn: fetchEmailProviders });

  const saveMutation = useMutation({
    mutationFn: ({ provider, data }) => saveEmailProvider(provider, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-providers"] });
      toast("Provider saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  if (isLoading) return <div className="text-text-muted">Loading…</div>;

  const byProvider = Object.fromEntries(providers.map((p) => [p.provider, p]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text">Email providers</h1>
        <p className="text-sm text-text-muted">
          Only one provider can be active (default) at a time — it's what every system email actually sends
          through. Enabling a provider doesn't activate it by itself.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {PROVIDERS.map((provider) => (
          <ProviderCard
            key={provider.key}
            provider={provider}
            record={byProvider[provider.key]}
            onSave={(data) => saveMutation.mutate({ provider: provider.key, data })}
            saving={saveMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function initialFormFor(provider, record) {
  return {
    isEnabled: record?.isEnabled || false,
    isDefault: record?.isDefault || false,
    credentials: Object.fromEntries(provider.credentialFields.map((f) => [f.key, record?.credentials?.[f.key] || ""])),
    config: Object.fromEntries(provider.configFields.map((f) => [f.key, record?.config?.[f.key] ?? ""])),
    secure: record?.config?.secure ?? false,
  };
}

function ProviderCard({ provider, record, onSave, saving }) {
  const [form, setForm] = useState(() => initialFormFor(provider, record));

  function setCredential(key, value) {
    setForm((f) => ({ ...f, credentials: { ...f.credentials, [key]: value } }));
  }

  function setConfig(key, value) {
    setForm((f) => ({ ...f, config: { ...f.config, [key]: value } }));
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(initialFormFor(provider, record));

  function handleSave() {
    const config = provider.hasSecureToggle ? { ...form.config, secure: form.secure } : form.config;
    onSave({ isEnabled: form.isEnabled, isDefault: form.isDefault, credentials: form.credentials, config });
  }

  return (
    <Card>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            {provider.label}
            {record?.isEnabled && <Badge tone="success">Enabled</Badge>}
            {record?.isDefault && <Badge tone="primary">Active</Badge>}
          </div>
        }
        description={provider.description}
        actions={<Switch checked={form.isEnabled} onChange={(v) => setForm({ ...form, isEnabled: v })} />}
      />
      <CardBody className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {provider.credentialFields.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              value={form.credentials[field.key]}
              onChange={(e) => setCredential(field.key, e.target.value)}
              placeholder="••••••••"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {provider.configFields.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              value={form.config[field.key]}
              onChange={(e) => setConfig(field.key, e.target.value)}
            />
          ))}
        </div>
        {provider.hasSecureToggle && (
          <Switch
            checked={form.secure}
            onChange={(v) => setForm({ ...form, secure: v })}
            label="Use TLS (secure connection)"
          />
        )}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <Switch checked={form.isDefault} onChange={(v) => setForm({ ...form, isDefault: v })} label="Active provider" />
          <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
            Save
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
