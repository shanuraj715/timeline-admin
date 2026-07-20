import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlatformSettings, updatePlatformSettings } from "../api/settings";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useToast } from "../context/ToastContext";

const BYTES_PER_MB = 1024 * 1024;

export default function CreditCosts() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: settings, isLoading } = useQuery({ queryKey: ["platform-settings"], queryFn: fetchPlatformSettings });

  const [creditsPerExtraTimeline, setCreditsPerExtraTimeline] = useState("");
  const [storageUnitMb, setStorageUnitMb] = useState("");
  const [storageUnitPriceCredits, setStorageUnitPriceCredits] = useState("");
  const [viewerListUnlockPriceCredits, setViewerListUnlockPriceCredits] = useState("");

  useEffect(() => {
    if (!settings) return;
    setCreditsPerExtraTimeline(String(settings.creditsPerExtraTimeline));
    setStorageUnitMb(String(Math.round(settings.storageUnitBytes / BYTES_PER_MB)));
    setStorageUnitPriceCredits(String(settings.storageUnitPriceCredits));
    setViewerListUnlockPriceCredits(String(settings.viewerListUnlockPriceCredits));
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updatePlatformSettings({
        creditsPerExtraTimeline: Number(creditsPerExtraTimeline),
        storageUnitBytes: Math.round(Number(storageUnitMb) * BYTES_PER_MB),
        storageUnitPriceCredits: Number(storageUnitPriceCredits),
        viewerListUnlockPriceCredits: Number(viewerListUnlockPriceCredits),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["platform-settings"], updated);
      toast("Credit costs saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  if (isLoading) return <div className="p-5 text-text-muted">Loading…</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text">Credit costs</h1>
        <p className="text-sm text-text-muted">How many credits each paid action across the platform costs.</p>
      </div>

      <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
        <Card className="mb-4 break-inside-avoid">
          <CardHeader
            title="Extra timelines"
            description="Charged once a member's account has already used up its free timeline count."
          />
          <CardBody className="flex flex-col gap-4">
            <Input
              label="Credits to create an extra timeline"
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

        <Card className="mb-4 break-inside-avoid">
          <CardHeader
            title="Extra storage"
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

        <Card className="mb-4 break-inside-avoid">
          <CardHeader
            title="Viewer list unlock"
            description="A one-time, per-timeline purchase an owner makes to see who's viewed their timeline. Anonymous guest viewing itself is toggled in Settings, not here."
          />
          <CardBody className="flex flex-col gap-4">
            <Input
              label="Price to unlock a timeline's viewer list (credits)"
              type="number"
              min={1}
              value={viewerListUnlockPriceCredits}
              onChange={(e) => setViewerListUnlockPriceCredits(e.target.value)}
            />
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="self-start">
              Save
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
