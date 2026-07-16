import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { fetchActiveStorageJob } from "../api/storage";

const ACTIVE_STATUSES = ["planning", "running", "verifying", "cutover", "cleanup", "cancelling"];

// Mounted once at the layout root (not on the Storage page itself) so a
// migration started from Platform > Storage stays visible — and known
// about — no matter where the admin navigates to next, including after
// closing and reopening the tab entirely (job state lives server-side).
export function StorageMigrationBanner() {
  const { data: job } = useQuery({
    queryKey: ["storage-job-active"],
    queryFn: fetchActiveStorageJob,
    refetchInterval: (query) => (query.state.data && ACTIVE_STATUSES.includes(query.state.data.status) ? 5000 : false),
  });

  if (!job || !ACTIVE_STATUSES.includes(job.status)) return null;

  const pct = job.totalFiles > 0 ? Math.round((job.processedFiles / job.totalFiles) * 100) : 0;

  return (
    <Link
      to="/platform#storage"
      className="flex items-center gap-2 bg-primary px-4 py-1.5 text-xs font-medium text-primary-fg hover:opacity-90"
    >
      <Loader2 size={13} className="animate-spin" />
      Storage migration in progress — {pct}% ({job.processedFiles}/{job.totalFiles} files). Click to view.
    </Link>
  );
}
