import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlatformSettings, updatePlatformSettings } from "../api/settings";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { AccentPicker } from "../components/AccentPicker";
import { useToast } from "../context/ToastContext";

const BYTES_PER_MB = 1024 * 1024;

export default function Settings() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: settings, isLoading } = useQuery({ queryKey: ["platform-settings"], queryFn: fetchPlatformSettings });

  const [freeStorageMb, setFreeStorageMb] = useState("");
  const [freeTimelines, setFreeTimelines] = useState("");
  const [creditsPerExtraTimeline, setCreditsPerExtraTimeline] = useState("");
  const [storageUnitMb, setStorageUnitMb] = useState("");
  const [storageUnitPriceCredits, setStorageUnitPriceCredits] = useState("");

  useEffect(() => {
    if (!settings) return;
    setFreeStorageMb(String(Math.round(settings.freeStorageBytesPerTimeline / BYTES_PER_MB)));
    setFreeTimelines(String(settings.freeTimelinesPerAccount));
    setCreditsPerExtraTimeline(String(settings.creditsPerExtraTimeline));
    setStorageUnitMb(String(Math.round(settings.storageUnitBytes / BYTES_PER_MB)));
    setStorageUnitPriceCredits(String(settings.storageUnitPriceCredits));
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updatePlatformSettings({
        freeStorageBytesPerTimeline: Math.round(Number(freeStorageMb) * BYTES_PER_MB),
        freeTimelinesPerAccount: Number(freeTimelines),
        creditsPerExtraTimeline: Number(creditsPerExtraTimeline),
        storageUnitBytes: Math.round(Number(storageUnitMb) * BYTES_PER_MB),
        storageUnitPriceCredits: Number(storageUnitPriceCredits),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["platform-settings"], updated);
      toast("Settings saved", "success");
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

      <Card>
        <CardHeader title="Appearance" description="Only affects this admin panel, on this device." />
        <CardBody>
          <span className="mb-2 block text-sm font-medium text-text">Accent color</span>
          <AccentPicker size="lg" />
        </CardBody>
      </Card>

      <Card>
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
            label="Credits to create an extra timeline (beyond the free count)"
            type="number"
            min={0}
            value={creditsPerExtraTimeline}
            onChange={(e) => setCreditsPerExtraTimeline(e.target.value)}
          />
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="self-start">
            Save
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Storage pricing"
          description="A timeline can buy extra storage in whole multiples of this amount — e.g. 100MB at 10 credits means 300MB costs 30 credits, and 150MB is rejected outright."
        />
        <CardBody className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unit size (MB)"
              type="number"
              min={1}
              value={storageUnitMb}
              onChange={(e) => setStorageUnitMb(e.target.value)}
            />
            <Input
              label="Price per unit (credits)"
              type="number"
              min={1}
              value={storageUnitPriceCredits}
              onChange={(e) => setStorageUnitPriceCredits(e.target.value)}
            />
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="self-start">
            Save
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
