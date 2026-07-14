import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HardDrive } from "lucide-react";
import { fetchAdminTimelines, updateTimelineStorageQuota } from "../api/admin";
import { Card } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";

const BYTES_PER_MB = 1024 * 1024;

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatBytes(bytes) {
  const mb = bytes / BYTES_PER_MB;
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(0)} MB`;
}

export default function Timelines() {
  const [q, setQ] = useState("");
  const [storageTarget, setStorageTarget] = useState(null);
  const { data: timelines = [], isLoading } = useQuery({
    queryKey: ["admin-timelines", q],
    queryFn: () => fetchAdminTimelines(q),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Timelines</h1>
          <p className="text-sm text-text-muted">All timelines across the platform.</p>
        </div>
        <Input placeholder="Search by title…" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
      </div>

      <Card>
        {isLoading ? (
          <div className="p-5 text-text-muted">Loading…</div>
        ) : timelines.length === 0 ? (
          <EmptyState title="No timelines found" description="Try a different search." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Owner</Th>
                <Th>Members</Th>
                <Th>Media</Th>
                <Th>Storage</Th>
                <Th>Created</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {timelines.map((t) => (
                <Tr key={t.id}>
                  <Td className="font-medium">{t.title}</Td>
                  <Td className="text-text-muted">
                    {t.owner ? `${t.owner.name} (${t.owner.email})` : "—"}
                  </Td>
                  <Td>{t.memberCount}</Td>
                  <Td>{t.mediaCount}</Td>
                  <Td className="text-text-muted">
                    {formatBytes(t.usedBytes)} / {formatBytes(t.quotaBytes)}
                  </Td>
                  <Td className="text-text-muted">{formatDate(t.createdAt)}</Td>
                  <Td>
                    <Button variant="secondary" size="sm" onClick={() => setStorageTarget(t)}>
                      <HardDrive size={14} /> Storage
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {storageTarget && <StorageQuotaModal timeline={storageTarget} onClose={() => setStorageTarget(null)} />}
    </div>
  );
}

function StorageQuotaModal({ timeline, onClose }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [quotaMb, setQuotaMb] = useState(String(Math.round(timeline.quotaBytes / BYTES_PER_MB)));

  const usedMb = timeline.usedBytes / BYTES_PER_MB;
  const parsedMb = Number(quotaMb);
  const isValid = quotaMb !== "" && Number.isFinite(parsedMb) && parsedMb >= usedMb;

  const saveMutation = useMutation({
    mutationFn: () => updateTimelineStorageQuota(timeline.id, Math.round(parsedMb * BYTES_PER_MB)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-timelines"] });
      toast("Storage quota updated", "success");
      onClose();
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={`Storage — "${timeline.title}"`}
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
