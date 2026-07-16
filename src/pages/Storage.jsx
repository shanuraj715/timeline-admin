import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  HardDrive,
  Cloud,
  CloudCog,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import {
  fetchStorageProviders,
  createStorageProvider,
  updateStorageProvider,
  deleteStorageProvider,
  recalculateStorageProvider,
  activateStorageProvider,
  fetchActiveStorageJob,
  cancelStorageJob,
  startOrphanScan,
  fetchLatestOrphanScan,
  deleteOrphanFiles,
} from "../api/storage";
import { Card, CardBody } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Input, Select, FieldHelp } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Switch } from "../components/ui/Switch";
import { Checkbox } from "../components/ui/Input";
import { useToast } from "../context/ToastContext";
import { formatBytes } from "../lib/format";

const PROVIDER_ICONS = { local: HardDrive, s3: Cloud, r2: CloudCog };
const ACTIVE_JOB_STATUSES = ["planning", "running", "verifying", "cutover", "cleanup", "cancelling"];
const CANCELLABLE_STATUSES = ["planning", "running", "verifying"];

const PHASE_LABEL = {
  planning: "Listing files…",
  running: "Transferring files…",
  verifying: "Checking for new files…",
  cutover: "Switching active bucket…",
  cleanup: "Cleaning up old files…",
  cancelling: "Cancelling — removing copied files…",
  completed: "Completed",
  cancelled: "Cancelled",
  failed: "Failed",
};

const EMPTY_PROVIDER = {
  name: "",
  type: "local",
  localPath: "",
  bucket: "",
  region: "",
  endpoint: "",
  forcePathStyle: false,
  accessKeyId: "",
  secretAccessKey: "",
  quotaBytes: null,
};

function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default function Storage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["storage-providers"],
    queryFn: fetchStorageProviders,
  });

  const { data: activeJob } = useQuery({
    queryKey: ["storage-job-active"],
    queryFn: fetchActiveStorageJob,
    refetchInterval: (query) => (query.state.data && ACTIVE_JOB_STATUSES.includes(query.state.data.status) ? 3000 : 8000),
  });

  const { data: orphanJob } = useQuery({
    queryKey: ["storage-orphan-scan"],
    queryFn: fetchLatestOrphanScan,
    refetchInterval: (query) => (query.state.data?.status === "planning" || query.state.data?.status === "running" ? 3000 : false),
  });

  const [modalProvider, setModalProvider] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [migratePrompt, setMigratePrompt] = useState(null); // { provider, message }
  const [selectedOrphans, setSelectedOrphans] = useState(new Set());

  function invalidateProviders() {
    queryClient.invalidateQueries({ queryKey: ["storage-providers"] });
  }
  function invalidateJob() {
    queryClient.invalidateQueries({ queryKey: ["storage-job-active"] });
  }

  const saveMutation = useMutation({
    mutationFn: (data) => (data.id ? updateStorageProvider(data.id, data) : createStorageProvider(data)),
    onSuccess: () => {
      invalidateProviders();
      setModalProvider(null);
      toast("Storage provider saved", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteStorageProvider(id),
    onSuccess: () => {
      invalidateProviders();
      setDeleteTarget(null);
      toast("Storage provider deleted", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const recalculateMutation = useMutation({
    mutationFn: (id) => recalculateStorageProvider(id),
    onSuccess: () => {
      invalidateProviders();
      toast("Usage recalculated", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const activateMutation = useMutation({
    mutationFn: ({ id, mode }) => activateStorageProvider(id, mode),
    onSuccess: (result) => {
      setMigratePrompt(null);
      if (result.activated) {
        invalidateProviders();
        toast("Storage provider activated", "success");
      } else if (result.migrationStarted) {
        invalidateJob();
        toast("Migration started — this can keep running even if you close this page", "success");
      }
    },
    onError: (err, variables) => {
      if (err.code === "MIGRATION_MODE_REQUIRED") {
        setMigratePrompt({ provider: variables.provider, message: err.message });
      } else {
        toast(err.message, "error");
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => cancelStorageJob(id),
    onSuccess: () => {
      invalidateJob();
      toast("Cancelling — removing files already copied to the target", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const scanMutation = useMutation({
    mutationFn: () => startOrphanScan(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-orphan-scan"] });
      setSelectedOrphans(new Set());
      toast("Orphan scan started", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const deleteOrphansMutation = useMutation({
    mutationFn: ({ providerId, keys }) => deleteOrphanFiles(providerId, keys),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["storage-orphan-scan"] });
      setSelectedOrphans(new Set());
      toast(`Deleted ${result.deleted} file${result.deleted === 1 ? "" : "s"}`, "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const activeProvider = providers.find((p) => p.isActive);

  function handleActivate(provider) {
    activateMutation.mutate({ id: provider.id, provider });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Storage</h1>
          <p className="text-sm text-text-muted">
            Manage where media, theme, and page files are stored — local disk, S3, or R2. Exactly one is active at a
            time.
          </p>
        </div>
        <Button onClick={() => setModalProvider({ ...EMPTY_PROVIDER })}>
          <Plus size={16} /> Add storage provider
        </Button>
      </div>

      {activeJob && ACTIVE_JOB_STATUSES.includes(activeJob.status) && (
        <JobProgressCard job={activeJob} providers={providers} onCancel={() => cancelMutation.mutate(activeJob.id)} />
      )}

      <Card>
        {isLoading ? (
          <CardBody>Loading…</CardBody>
        ) : providers.length === 0 ? (
          <EmptyState title="No storage providers yet" description="Add one to get started." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Usage</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {providers.map((p) => {
                const Icon = PROVIDER_ICONS[p.type] || Cloud;
                const pct = p.quotaBytes ? Math.min(100, (p.usageBytes / p.quotaBytes) * 100) : null;
                return (
                  <Tr key={p.id}>
                    <Td className="font-medium">
                      <div className="flex items-center gap-2">
                        <Icon size={15} className="text-text-muted" />
                        {p.name}
                        {p.isActive && <Badge tone="primary">Active</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {p.type === "local" ? p.localPath : `${p.bucket}${p.region ? ` · ${p.region}` : ""}`}
                      </p>
                    </Td>
                    <Td className="text-text-muted uppercase text-xs">{p.type}</Td>
                    <Td className="min-w-[180px]">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">
                          {formatBytes(p.usageBytes)}
                          {p.quotaBytes ? ` of ${formatBytes(p.quotaBytes)}` : ""}
                          <span className="ml-1.5 text-xs text-text-muted">· {p.objectCount} files</span>
                        </span>
                        {pct !== null && <ProgressBar value={pct} />}
                        <span className="text-[11px] text-text-muted">
                          {p.usageComputedAt ? `as of ${new Date(p.usageComputedAt).toLocaleString()}` : "not yet calculated"}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        {!p.isActive && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={activateMutation.isPending || Boolean(activeJob && ACTIVE_JOB_STATUSES.includes(activeJob.status))}
                            onClick={() => handleActivate(p)}
                          >
                            Set active
                          </Button>
                        )}
                        <IconButton
                          label="Recalculate usage"
                          icon={RefreshCw}
                          onClick={() => recalculateMutation.mutate(p.id)}
                          disabled={recalculateMutation.isPending}
                        />
                        <IconButton label="Edit" icon={Pencil} onClick={() => setModalProvider({ ...p, secretAccessKey: p.secretAccessKeyMasked })} />
                        <IconButton
                          label="Delete"
                          icon={Trash2}
                          variant="danger"
                          disabled={p.isActive}
                          onClick={() => setDeleteTarget(p)}
                        />
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Card>

      <OrphanFilesCard
        job={orphanJob}
        activeProvider={activeProvider}
        selected={selectedOrphans}
        onToggleSelect={(key) =>
          setSelectedOrphans((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
          })
        }
        onScan={() => scanMutation.mutate()}
        scanning={scanMutation.isPending || orphanJob?.status === "planning" || orphanJob?.status === "running"}
        onDeleteSelected={() =>
          deleteOrphansMutation.mutate({ providerId: orphanJob.providerId, keys: Array.from(selectedOrphans) })
        }
        deleting={deleteOrphansMutation.isPending}
      />

      {modalProvider && (
        <ProviderModal
          provider={modalProvider}
          onClose={() => setModalProvider(null)}
          onSave={(data) => saveMutation.mutate(data)}
          saving={saveMutation.isPending}
        />
      )}

      {deleteTarget && (
        <Modal
          open
          onClose={() => setDeleteTarget(null)}
          title="Delete storage provider"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-text">
            Delete "<strong>{deleteTarget.name}</strong>"? This only removes the configuration — it does not delete
            any files. Fails if this provider is currently active or part of an in-progress migration.
          </p>
        </Modal>
      )}

      {migratePrompt && (
        <Modal
          open
          onClose={() => setMigratePrompt(null)}
          title="Move or copy existing data?"
          footer={
            <>
              <Button variant="secondary" onClick={() => setMigratePrompt(null)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                disabled={activateMutation.isPending}
                onClick={() => activateMutation.mutate({ id: migratePrompt.provider.id, mode: "copy", provider: migratePrompt.provider })}
              >
                Copy
              </Button>
              <Button
                disabled={activateMutation.isPending}
                onClick={() => activateMutation.mutate({ id: migratePrompt.provider.id, mode: "move", provider: migratePrompt.provider })}
              >
                Move
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3 text-sm text-text">
            <p>{migratePrompt.message}</p>
            <p>
              <strong>Move</strong> copies every file to "{migratePrompt.provider.name}", switches the site over to
              it, then deletes the files from the old provider.
            </p>
            <p>
              <strong>Copy</strong> does the same but leaves the old provider's files in place — uses more storage,
              but keeps a backup.
            </p>
            <p className="text-text-muted">
              This runs in the background on the server — you can close this page and it'll keep going. The old
              provider stays in use until every file has been copied.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

function JobProgressCard({ job, providers, onCancel }) {
  const source = providers.find((p) => p.id === job.sourceProviderId);
  const target = providers.find((p) => p.id === job.targetProviderId);
  const pct = job.totalFiles > 0 ? Math.round((job.processedFiles / job.totalFiles) * 100) : 0;
  const cancellable = CANCELLABLE_STATUSES.includes(job.status);

  return (
    <Card>
      <CardBody className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text">
              {job.status === "cancelling" ? "Cancelling migration" : "Migrating storage"}
              {source && target && (
                <span className="ml-2 font-normal text-text-muted">
                  {source.name} → {target.name} ({job.mode})
                </span>
              )}
            </p>
            <p className="text-xs text-text-muted">{PHASE_LABEL[job.status] || job.status}</p>
          </div>
          {cancellable && (
            <Button variant="danger" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
        <ProgressBar value={pct} />
        <div className="flex justify-between text-xs text-text-muted">
          <span>
            {job.processedFiles} of {job.totalFiles} files ({formatBytes(job.processedBytes)} of{" "}
            {formatBytes(job.totalBytes)})
          </span>
          <span>{pct}%</span>
        </div>
        {job.failedFiles > 0 && (
          <p className="text-xs text-danger">
            {job.failedFiles} file{job.failedFiles === 1 ? "" : "s"} failed to transfer — check the server logs.
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function ProviderModal({ provider, onClose, onSave, saving }) {
  const [form, setForm] = useState(provider);
  const isRemote = form.type === "s3" || form.type === "r2";

  return (
    <Modal
      open
      onClose={onClose}
      title={form.id ? "Edit storage provider" : "Add storage provider"}
      width="560px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)} disabled={saving || !form.name || (form.type === "local" ? !form.localPath : !form.bucket)}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Production R2" />
        {!form.id && (
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="local">Local disk</option>
            <option value="s3">Amazon S3</option>
            <option value="r2">Cloudflare R2</option>
          </Select>
        )}

        {form.type === "local" && (
          <Input
            label="Local path"
            help="An absolute or relative path on the server's filesystem."
            value={form.localPath}
            onChange={(e) => setForm({ ...form, localPath: e.target.value })}
            placeholder="./storage"
          />
        )}

        {isRemote && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Bucket" value={form.bucket} onChange={(e) => setForm({ ...form, bucket: e.target.value })} />
              <Input
                label="Region"
                help="Leave blank for R2 (it doesn't use regions)."
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="us-east-1"
              />
            </div>
            <Input
              label="Endpoint"
              help={
                form.type === "r2"
                  ? "Required for R2 — looks like https://<account-id>.r2.cloudflarestorage.com"
                  : "Leave blank for real AWS S3. Set this for any other S3-compatible provider (MinIO, Backblaze B2, ...)."
              }
              value={form.endpoint}
              onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
              placeholder={form.type === "r2" ? "https://<account-id>.r2.cloudflarestorage.com" : ""}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Access key ID"
                value={form.accessKeyId}
                onChange={(e) => setForm({ ...form, accessKeyId: e.target.value })}
              />
              <Input
                label="Secret access key"
                type="password"
                value={form.secretAccessKey}
                onChange={(e) => setForm({ ...form, secretAccessKey: e.target.value })}
                placeholder={form.id ? "Leave as-is to keep the current secret" : ""}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Switch
                checked={form.forcePathStyle}
                onChange={(v) => setForm({ ...form, forcePathStyle: v })}
                label="Force path-style URLs"
              />
              <FieldHelp text="Required for R2, MinIO, and most non-AWS S3-compatible providers." />
            </div>
          </>
        )}

        <Input
          label="Quota (optional)"
          help="A soft, informational cap shown as a usage bar — nothing enforces this automatically."
          type="number"
          min={0}
          value={form.quotaBytes ? Math.round(form.quotaBytes / (1024 * 1024)) : ""}
          onChange={(e) => setForm({ ...form, quotaBytes: e.target.value ? Number(e.target.value) * 1024 * 1024 : null })}
          placeholder="MB"
        />
      </div>
    </Modal>
  );
}

function OrphanFilesCard({ job, activeProvider, selected, onToggleSelect, onScan, scanning, onDeleteSelected, deleting }) {
  const orphans = job?.status === "completed" ? job.orphanedKeys || [] : [];
  const totalOrphanBytes = orphans.reduce((sum, o) => sum + o.size, 0);

  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text">Orphaned files</p>
            <p className="text-xs text-text-muted">
              Files in {activeProvider ? `"${activeProvider.name}"` : "the active storage provider"} that no longer
              belong to any timeline media, theme image, or referenced page content.
            </p>
          </div>
          <Button variant="secondary" onClick={onScan} disabled={scanning}>
            <Search size={15} /> {scanning ? "Scanning…" : "Scan for orphans"}
          </Button>
        </div>

        {job && (job.status === "planning" || job.status === "running") && (
          <p className="text-xs text-text-muted">
            {job.status === "planning" ? `Listing files… (${job.totalFiles} found so far)` : "Checking which files are still referenced…"}
          </p>
        )}

        {job?.status === "completed" && (
          <>
            {orphans.length === 0 ? (
              <p className="text-sm text-text-muted">No orphaned files found — everything in storage is in use.</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-muted">
                    {orphans.length} orphaned file{orphans.length === 1 ? "" : "s"} · {formatBytes(totalOrphanBytes)} reclaimable
                  </p>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={selected.size === 0 || deleting}
                    onClick={onDeleteSelected}
                  >
                    <Trash2 size={14} /> Delete selected ({selected.size})
                  </Button>
                </div>
                <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
                  <Table>
                    <Thead>
                      <Tr>
                        <Th />
                        <Th>Key</Th>
                        <Th>Size</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {orphans.map((o) => (
                        <Tr key={o.key}>
                          <Td>
                            <Checkbox checked={selected.has(o.key)} onChange={() => onToggleSelect(o.key)} />
                          </Td>
                          <Td className="font-mono text-xs">{o.key}</Td>
                          <Td className="text-text-muted">{formatBytes(o.size)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </div>
              </>
            )}
          </>
        )}

        {!job && <p className="text-sm text-text-muted">Run a scan to find files that are no longer referenced anywhere.</p>}
      </CardBody>
    </Card>
  );
}
