import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { fetchPlatformSettings, updatePlatformSettings } from "../api/settings";
import { fetchRecaptchaSettings, updateRecaptchaSettings } from "../api/recaptcha";
import { fetchGoogleOAuthSettings, updateGoogleOAuthSettings } from "../api/googleOAuth";
import { fetchAnalyticsSettings, updateAnalyticsSettings } from "../api/analyticsSettings";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Input, Textarea } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Switch } from "../components/ui/Switch";
import { AccentPicker } from "../components/AccentPicker";
import { useToast } from "../context/ToastContext";
import { confirmSecretClear } from "../lib/confirmSecretClear";

const BYTES_PER_MB = 1024 * 1024;

export default function Settings() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: settings, isLoading } = useQuery({ queryKey: ["platform-settings"], queryFn: fetchPlatformSettings });

  const [freeStorageMb, setFreeStorageMb] = useState("");
  const [freeTimelines, setFreeTimelines] = useState("");
  const [defaultCreditsOnSignup, setDefaultCreditsOnSignup] = useState("");
  const [allowGuestViewing, setAllowGuestViewing] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setFreeStorageMb(String(Math.round(settings.freeStorageBytesPerTimeline / BYTES_PER_MB)));
    setFreeTimelines(String(settings.freeTimelinesPerAccount));
    setDefaultCreditsOnSignup(String(settings.defaultCreditsOnSignup ?? 0));
    setAllowGuestViewing(Boolean(settings.allowGuestViewing));
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updatePlatformSettings({
        freeStorageBytesPerTimeline: Math.round(Number(freeStorageMb) * BYTES_PER_MB),
        freeTimelinesPerAccount: Number(freeTimelines),
        defaultCreditsOnSignup: Number(defaultCreditsOnSignup),
        allowGuestViewing,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["platform-settings"], updated);
      toast("Settings saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  useEffect(() => {
    if (!settings?.maintenanceMode) return;
    setMaintenanceEnabled(settings.maintenanceMode.enabled);
    setMaintenanceMessage(settings.maintenanceMode.message || "");
  }, [settings]);

  const maintenanceMutation = useMutation({
    mutationFn: (patch) => updatePlatformSettings({ maintenanceMode: patch }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["platform-settings"], updated);
      toast(
        updated.maintenanceMode.enabled
          ? "Maintenance mode enabled — the main site is now down for visitors"
          : "Maintenance mode disabled",
        updated.maintenanceMode.enabled ? "info" : "success"
      );
    },
    onError: (err) => toast(err.message, "error"),
  });

  const { data: recaptcha, isLoading: recaptchaLoading } = useQuery({
    queryKey: ["recaptcha-settings"],
    queryFn: fetchRecaptchaSettings,
  });
  const [siteKey, setSiteKey] = useState("");
  const [secretKey, setSecretKey] = useState("");

  useEffect(() => {
    if (!recaptcha) return;
    setSiteKey(recaptcha.siteKey || "");
    // Pre-filled with the masked placeholder, not the real secret (the
    // server never sends that back) — saving without touching this field
    // leaves the stored key unchanged, same convention as payment gateway
    // credentials.
    setSecretKey(recaptcha.secretKeyMasked || "");
  }, [recaptcha]);

  const recaptchaMutation = useMutation({
    mutationFn: () => updateRecaptchaSettings({ siteKey, secretKey }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["recaptcha-settings"], updated);
      setSecretKey(updated.secretKeyMasked || "");
      toast("reCAPTCHA settings saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const { data: googleOAuth, isLoading: googleOAuthLoading } = useQuery({
    queryKey: ["google-oauth-settings"],
    queryFn: fetchGoogleOAuthSettings,
  });
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    if (!googleOAuth) return;
    setGoogleClientId(googleOAuth.clientId || "");
    // Pre-filled with the masked placeholder, same convention as the
    // reCAPTCHA secret above — saving without touching this field leaves
    // the stored secret unchanged.
    setGoogleClientSecret(googleOAuth.clientSecretMasked || "");
    setGoogleEnabled(googleOAuth.isEnabled);
  }, [googleOAuth]);

  const googleOAuthMutation = useMutation({
    mutationFn: () =>
      updateGoogleOAuthSettings({ clientId: googleClientId, clientSecret: googleClientSecret, isEnabled: googleEnabled }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["google-oauth-settings"], updated);
      setGoogleClientSecret(updated.clientSecretMasked || "");
      toast("Google sign-in settings saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics-settings"],
    queryFn: fetchAnalyticsSettings,
  });
  const [measurementId, setMeasurementId] = useState("");
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    if (!analytics) return;
    setMeasurementId(analytics.measurementId || "");
    setAnalyticsEnabled(analytics.enabled);
  }, [analytics]);

  const analyticsMutation = useMutation({
    mutationFn: () => updateAnalyticsSettings({ measurementId, enabled: analyticsEnabled }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["analytics-settings"], updated);
      toast("Google Analytics settings saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  if (isLoading) return <div className="p-5 text-text-muted">Loading…</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text">Settings</h1>
        <p className="text-sm text-text-muted">Platform limits and how the admin panel looks.</p>
      </div>

      {/* Multi-column (not grid) on purpose — these cards are different
          heights, and CSS Grid sizes a whole row to its tallest cell,
          which left a dead gap under the shorter cards before the next
          row started. `columns` flows each card into the next available
          space instead, like masonry. */}
      <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
        <Card className={`mb-4 break-inside-avoid ${settings?.maintenanceMode?.enabled ? "border-warning/50" : ""}`}>
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                Maintenance mode
                {settings?.maintenanceMode?.enabled && (
                  <Badge tone="warning">
                    <span className="inline-flex items-center gap-1">
                      <AlertTriangle size={12} /> Live
                    </span>
                  </Badge>
                )}
              </div>
            }
            description="Affects the main site only — every API call from there returns a maintenance response and visitors see a maintenance page instead. This admin panel is never affected, so you can always come back here to turn it off."
          />
          <CardBody className="flex flex-col gap-4">
            <Switch
              checked={maintenanceEnabled}
              onChange={setMaintenanceEnabled}
              label={maintenanceEnabled ? "Site will be in maintenance mode" : "Site will be live"}
            />
            <Textarea
              label="Message shown to visitors"
              rows={3}
              maxLength={500}
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="We're currently performing scheduled maintenance. We'll be back shortly."
            />
            <Button
              onClick={() => maintenanceMutation.mutate({ enabled: maintenanceEnabled, message: maintenanceMessage })}
              disabled={maintenanceMutation.isPending}
              variant={maintenanceEnabled ? "danger" : "primary"}
              className="self-start"
            >
              {maintenanceEnabled ? "Save & take site down" : "Save"}
            </Button>
          </CardBody>
        </Card>

        <Card className="mb-4 break-inside-avoid">
          <CardHeader title="Appearance" description="Only affects this admin panel, on this device." />
          <CardBody>
            <span className="mb-2 block text-sm font-medium text-text">Accent color</span>
            <AccentPicker size="lg" />
          </CardBody>
        </Card>

        <Card className="mb-4 break-inside-avoid">
          <CardHeader
            title="Free tier limits"
            description="Free storage applies live to every timeline, including existing ones — raising it here benefits everyone immediately. The timeline-count limit only affects timelines created from now on."
          />
          <CardBody className="flex flex-col gap-4">
            <Input
              label="Free storage per timeline (MB)"
              type="number"
              min={0}
              value={freeStorageMb}
              onChange={(e) => setFreeStorageMb(e.target.value)}
            />
            <Input
              label="Free timelines per account"
              type="number"
              min={0}
              value={freeTimelines}
              onChange={(e) => setFreeTimelines(e.target.value)}
            />
            <Input
              label="Credits granted automatically on signup"
              help="Added to every new account's balance the moment they register. 0 means no signup bonus."
              type="number"
              min={0}
              value={defaultCreditsOnSignup}
              onChange={(e) => setDefaultCreditsOnSignup(e.target.value)}
            />
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="self-start">
              Save
            </Button>
          </CardBody>
        </Card>

        <Card className="mb-4 break-inside-avoid">
          <CardHeader
            title="Guest viewing"
            description="Global switch for anonymous (not logged in) access to Public timelines — off means every public timeline requires login regardless of the owner's own setting. Each owner also has to opt in per timeline (Timeline settings → Visibility), off by default, so this alone doesn't expose anything. The credit price to unlock a timeline's viewer list is set in Commerce → Credit costs."
          />
          <CardBody className="flex flex-col gap-4">
            <Switch
              checked={allowGuestViewing}
              onChange={setAllowGuestViewing}
              label={allowGuestViewing ? "Anonymous visitors can view Public timelines" : "Anonymous visitors are sent to login"}
            />
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="self-start">
              Save
            </Button>
          </CardBody>
        </Card>

        <Card className="mb-4 break-inside-avoid">
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                reCAPTCHA
                {!recaptchaLoading && (
                  <Badge tone={recaptcha?.secretKeyConfigured ? "success" : "neutral"}>
                    {recaptcha?.secretKeyConfigured ? "Configured" : "Not configured"}
                  </Badge>
                )}
              </div>
            }
            description="Google reCAPTCHA v3 keys for login and registration. Leave both blank to turn it off entirely — or keep the keys and use the Feature flags tab to disable checks temporarily without losing them."
          />
          <CardBody className="flex flex-col gap-4">
            <Input
              label="Site key"
              value={siteKey}
              onChange={(e) => setSiteKey(e.target.value)}
              placeholder="6Lc…"
            />
            <Input
              label="Secret key"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="6Lc…"
            />
            <Button
              onClick={() => {
                const ok = confirmSecretClear([
                  { label: "reCAPTCHA secret key", hadValue: Boolean(recaptcha?.secretKeyConfigured), isEmpty: !secretKey.trim() },
                ]);
                if (ok) recaptchaMutation.mutate();
              }}
              disabled={recaptchaMutation.isPending}
              className="self-start"
            >
              Save
            </Button>
          </CardBody>
        </Card>

        <Card className="mb-4 break-inside-avoid">
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                Google sign-in
                {!googleOAuthLoading && (
                  <Badge tone={googleOAuth?.clientSecretConfigured ? "success" : "neutral"}>
                    {googleOAuth?.clientSecretConfigured ? "Configured" : "Not configured"}
                  </Badge>
                )}
              </div>
            }
            description={
              <>
                OAuth client for "Continue with Google" on the login and register pages. Create an OAuth 2.0
                Client ID in Google Cloud Console and add this exact redirect URI to it:{" "}
                <code className="rounded bg-surface-hover px-1 py-0.5 text-xs">
                  {"{your site's URL}"}/api/auth/google/callback
                </code>
              </>
            }
          />
          <CardBody className="flex flex-col gap-4">
            <Input
              label="Client ID"
              value={googleClientId}
              onChange={(e) => setGoogleClientId(e.target.value)}
              placeholder="123456789-abc.apps.googleusercontent.com"
            />
            <Input
              label="Client secret"
              value={googleClientSecret}
              onChange={(e) => setGoogleClientSecret(e.target.value)}
              placeholder="GOCSPX-…"
            />
            <Switch
              checked={googleEnabled}
              onChange={setGoogleEnabled}
              label={googleEnabled ? "Button is shown to visitors" : "Button is hidden"}
            />
            <Button
              onClick={() => {
                const ok = confirmSecretClear([
                  { label: "Google client secret", hadValue: Boolean(googleOAuth?.clientSecretConfigured), isEmpty: !googleClientSecret.trim() },
                ]);
                if (ok) googleOAuthMutation.mutate();
              }}
              disabled={googleOAuthMutation.isPending}
              className="self-start"
            >
              Save
            </Button>
          </CardBody>
        </Card>

        <Card className="mb-4 break-inside-avoid">
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                Google Analytics
                {!analyticsLoading && (
                  <Badge tone={analytics?.measurementId ? "success" : "neutral"}>
                    {analytics?.measurementId ? "Configured" : "Not configured"}
                  </Badge>
                )}
              </div>
            }
            description="GA4 Measurement ID for tracking visits to the main site. Leave the ID blank or turn tracking off to stop loading Google Analytics entirely."
          />
          <CardBody className="flex flex-col gap-4">
            <Input
              label="Measurement ID"
              value={measurementId}
              onChange={(e) => setMeasurementId(e.target.value)}
              placeholder="G-XXXXXXXXXX"
            />
            <Switch
              checked={analyticsEnabled}
              onChange={setAnalyticsEnabled}
              label={analyticsEnabled ? "Tracking is active on the main site" : "Tracking is off"}
            />
            <Button onClick={() => analyticsMutation.mutate()} disabled={analyticsMutation.isPending} className="self-start">
              Save
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
