import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTimelineStorageQuota } from "../api/admin";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { useToast } from "../context/ToastContext";

const BYTES_PER_MB = 1024 * 1024;

export function formatBytes(bytes) {
  const mb = bytes / BYTES_PER_MB;
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(0)} MB`;
}

// Shared between the Timelines tab (which knows the timeline's title) and
// the Users tab's per-user Timelines popup (which deliberately doesn't —
// see that modal's own comment), hence the generic `title` prop rather
// than reading it off `timeline` here.
export function StorageQuotaModal({ timeline, title, invalidateKeys, onClose }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [quotaMb, setQuotaMb] = useState(String(Math.round(timeline.quotaBytes / BYTES_PER_MB)));

  const usedMb = timeline.usedBytes / BYTES_PER_MB;
  const parsedMb = Number(quotaMb);
  const isValid = quotaMb !== "" && Number.isFinite(parsedMb) && parsedMb >= usedMb;

  const saveMutation = useMutation({
    mutationFn: () => updateTimelineStorageQuota(timeline.id, Math.round(parsedMb * BYTES_PER_MB)),
    onSuccess: () => {
      invalidateKeys?.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      toast("Storage quota updated", "success");
      onClose();
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={!isValid || saveMutation.isPending}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">
          Currently using <strong className="text-text">{formatBytes(timeline.usedBytes)}</strong>.
        </p>
        <Input
          label="Quota (MB)"
          type="number"
          min={Math.ceil(usedMb)}
          value={quotaMb}
          onChange={(e) => setQuotaMb(e.target.value)}
          error={!isValid ? `Can't be less than what's already used (${formatBytes(timeline.usedBytes)})` : undefined}
        />
      </div>
    </Modal>
  );
}
