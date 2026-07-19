import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HardDrive, PauseCircle, PlayCircle, ArrowRightLeft, Download } from "lucide-react";
import {
  fetchAdminTimelines,
  suspendTimeline,
  restoreTimeline,
  transferTimelineOwnership,
  bulkTimelineAction,
} from "../api/admin";
import { fetchUsers } from "../api/users";
import { Card } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { Input, Textarea, Checkbox } from "../components/ui/Input";
import { Button, LinkButton } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Modal } from "../components/ui/Modal";
import { StorageQuotaModal, formatBytes } from "../components/StorageQuotaModal";
import { useToast } from "../context/ToastContext";

const LIMIT = 20;

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Timelines() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [storageTarget, setStorageTarget] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["admin-timelines", q, page],
    queryFn: () => fetchAdminTimelines({ q, page, limit: LIMIT }),
  });
  const timelines = data?.timelines || [];

  // Selection spans only what's currently on screen — clear it whenever the
  // search or page changes so "N selected" can never silently refer to rows
  // that are no longer visible.
  useEffect(() => {
    setSelected(new Set());
  }, [q, page]);

  const restoreMutation = useMutation({
    mutationFn: (id) => restoreTimeline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-timelines"] });
      toast("Timeline restored", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const bulkMutation = useMutation({
    mutationFn: (action) => bulkTimelineAction(Array.from(selected), action),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-timelines"] });
      setSelected(new Set());
      toast(
        `${result.succeeded} succeeded${result.failed ? `, ${result.failed} failed` : ""}`,
        result.failed ? "error" : "success"
      );
    },
    onError: (err) => toast(err.message, "error"),
  });

  const allSelected = timelines.length > 0 && timelines.every((t) => selected.has(t.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(timelines.map((t) => t.id)));
  }

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Timelines</h1>
          <p className="text-sm text-text-muted">All timelines across the platform.</p>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton
            variant="secondary"
            href={`/api/admin/timelines?format=csv${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          >
            <Download size={14} /> Export CSV
          </LinkButton>
          <Input
            placeholder="Search by title…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="w-64"
          />
        </div>
      </div>

      {selected.size > 0 && (
        <Card className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-text">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => bulkMutation.mutate("restore")} disabled={bulkMutation.isPending}>
              Restore selected
            </Button>
            <Button variant="danger" size="sm" onClick={() => bulkMutation.mutate("suspend")} disabled={bulkMutation.isPending}>
              Suspend selected
            </Button>
          </div>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <div className="p-5 text-text-muted">Loading…</div>
        ) : timelines.length === 0 ? (
          <EmptyState title="No timelines found" description="Try a different search." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>
                  <Checkbox checked={allSelected} onChange={toggleAll} />
                </Th>
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
                  <Td>
                    <Checkbox checked={selected.has(t.id)} onChange={() => toggleOne(t.id)} />
                  </Td>
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
                    <div className="flex justify-end gap-2">
                      <IconButton label="Suspend timeline" icon={PauseCircle} onClick={() => setSuspendTarget(t)} />
                      <IconButton
                        label="Restore timeline"
                        icon={PlayCircle}
                        onClick={() => restoreMutation.mutate(t.id)}
                        disabled={restoreMutation.isPending}
                      />
                      <IconButton
                        label="Transfer ownership"
                        icon={ArrowRightLeft}
                        onClick={() => setTransferTarget(t)}
                      />
                      <IconButton label="Manage storage quota" icon={HardDrive} onClick={() => setStorageTarget(t)} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        {data && <Pagination page={data.page} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>

      {storageTarget && (
        <StorageQuotaModal
          timeline={storageTarget}
          title={`Storage — "${storageTarget.title}"`}
          invalidateKeys={[["admin-timelines"]]}
          onClose={() => setStorageTarget(null)}
        />
      )}

      {suspendTarget && <SuspendModal timeline={suspendTarget} onClose={() => setSuspendTarget(null)} />}

      {transferTarget && (
        <TransferOwnershipModal timeline={transferTarget} onClose={() => setTransferTarget(null)} />
      )}
    </div>
  );
}

function SuspendModal({ timeline, onClose }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () => suspendTimeline(timeline.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-timelines"] });
      toast("Timeline suspended", "success");
      onClose();
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={`Suspend — "${timeline.title}"`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            Suspend
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text">
          Suspend this timeline? Its members will immediately lose access until it's restored.
        </p>
        <Textarea
          label="Reason (optional, kept in the audit log)"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Modal>
  );
}

function TransferOwnershipModal({ timeline, onClose }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-transfer-user-search", search],
    queryFn: () => fetchUsers({ q: search, page: 1, limit: 5 }),
    enabled: search.trim().length > 0,
  });
  const results = data?.users || [];

  const mutation = useMutation({
    mutationFn: () => transferTimelineOwnership(timeline.id, selectedUser.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-timelines"] });
      toast(`Ownership transferred to ${selectedUser.name}`, "success");
      onClose();
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={`Transfer ownership — "${timeline.title}"`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!selectedUser || mutation.isPending}>
            Transfer
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          label="New owner"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedUser(null);
          }}
        />
        {search.trim() && (
          <div className="flex flex-col gap-1">
            {isLoading ? (
              <p className="text-sm text-text-muted">Searching…</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-text-muted">No users found.</p>
            ) : (
              results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedUser(u)}
                  className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    selectedUser?.id === u.id ? "border-primary bg-primary/10" : "border-border hover:bg-surface-hover"
                  }`}
                >
                  <span className="font-medium text-text">{u.name}</span>
                  <span className="text-xs text-text-muted">{u.email}</span>
                </button>
              ))
            )}
          </div>
        )}
        {selectedUser && (
          <p className="text-xs text-text-muted">
            Selected: <strong className="text-text">{selectedUser.name}</strong> ({selectedUser.email})
          </p>
        )}
      </div>
    </Modal>
  );
}
