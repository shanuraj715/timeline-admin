import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlatformSettings, updatePlatformSettings } from "../api/settings";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useToast } from "../context/ToastContext";

const BYTES_PER_MB = 1024 * 1024;

export default function Settings() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: settings, isLoading } = useQuery({ queryKey: ["platform-settings"], queryFn: fetchPlatformSettings });

  const [freeStorageMb, setFreeStorageMb] = useState("");
  const [freeTimelines, setFreeTimelines] = useState("");
  const [creditsPerExtraTimeline, setCreditsPerExtraTimeline] = useState("");

  useEffect(() => {
    if (!settings) return;
    setFreeStorageMb(String(Math.round(settings.freeStorageBytesPerTimeline / BYTES_PER_MB)));
    setFreeTimelines(String(settings.freeTimelinesPerAccount));
    setCreditsPerExtraTimeline(String(settings.creditsPerExtraTimeline));
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updatePlatformSettings({
        freeStorageBytesPerTimeline: Math.round(Number(freeStorageMb) * BYTES_PER_MB),
        freeTimelinesPerAccount: Number(freeTimelines),
        creditsPerExtraTimeline: Number(creditsPerExtraTimeline),
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
        <h1 className="text-lg font-semibold text-text">Free tier limits</h1>
        <p className="text-sm text-text-muted">
          Controls how much a new timeline gets for free before its owner needs credits.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Storage & timeline limits"
          description="These apply to newly created timelines and accounts — existing ones keep whatever quota they already have."
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
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="self-start"
          >
            Save
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
