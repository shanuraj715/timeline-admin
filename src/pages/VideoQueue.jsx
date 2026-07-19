import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCw } from "lucide-react";
import { fetchVideoQueue, retryVideoProcessing } from "../api/admin";
import { StatTile } from "../components/StatTile";
import { Card } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { IconButton } from "../components/ui/IconButton";
import { useToast } from "../context/ToastContext";

const LIMIT = 20;

const STATUS_TONE = { pending: "neutral", processing: "primary", failed: "danger" };

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function VideoQueue() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-video-queue", status, page],
    queryFn: () => fetchVideoQueue({ status, page, limit: LIMIT }),
  });
  const items = data?.items || [];
  const counts = data?.counts || { pending: 0, processing: 0, failed: 0 };

  const retryMutation = useMutation({
    mutationFn: (mediaId) => retryVideoProcessing(mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-queue"] });
      toast("Retrying — the worker will pick this up shortly.", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">System health</h1>
          <p className="text-sm text-text-muted">Video processing queue across all timelines.</p>
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-48"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatTile label="Pending" value={counts.pending} />
        <StatTile label="Processing" value={counts.processing} />
        <StatTile label="Failed" value={counts.failed} />
      </div>

      <Card>
        {isLoading ? (
          <div className="p-5 text-text-muted">Loading…</div>
        ) : items.length === 0 ? (
          <EmptyState title="Queue is empty" description="Nothing matches this filter." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Timeline</Th>
                <Th>Filename</Th>
                <Th>Status</Th>
                <Th>Attempts</Th>
                <Th>Last attempt</Th>
                <Th>Created</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {items.map((item) => (
                <Tr key={item.id}>
                  <Td className="font-medium">{item.timelineTitle || "—"}</Td>
                  <Td className="max-w-[220px] truncate text-text-muted" title={item.filename}>
                    {item.filename}
                  </Td>
                  <Td>
                    <div className="flex flex-col items-start gap-1">
                      <Badge tone={STATUS_TONE[item.processingStatus] || "neutral"}>{item.processingStatus}</Badge>
                      {item.processingStatus === "failed" && item.processingError && (
                        <span
                          className="max-w-[220px] truncate text-xs text-danger"
                          title={item.processingError}
                        >
                          {item.processingError}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td>{item.processingAttempts}</Td>
                  <Td className="text-text-muted">{formatDate(item.lastAttemptAt)}</Td>
                  <Td className="text-text-muted">{formatDate(item.createdAt)}</Td>
                  <Td>
                    {item.processingStatus === "failed" && (
                      <div className="flex justify-end">
                        <IconButton
                          label="Retry"
                          icon={RotateCw}
                          onClick={() => retryMutation.mutate(item.id)}
                          disabled={retryMutation.isPending}
                        />
                      </div>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        {data && <Pagination page={data.page} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>
    </div>
  );
}
