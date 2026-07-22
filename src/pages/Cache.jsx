import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCw, Trash2, Zap } from "lucide-react";
import { fetchCacheReport, purgeCache, warmCache } from "../api/cache";
import { StatTile } from "../components/StatTile";
import { Card } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { useToast } from "../context/ToastContext";

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Mirrors the reasoning in timeline/src/lib/cacheTracker.js — "purged"
// wins over "stale" since a purge is a deliberate, more recent signal than
// just the TTL lapsing; both mean the same thing in practice (next visit
// regenerates it), the label just says why.
function resourceStatus(r) {
  if (!r.lastGeneratedAt) return { label: "Never generated", tone: "neutral" };
  if (r.purgedAt && new Date(r.purgedAt) > new Date(r.lastGeneratedAt)) {
    return { label: "Purged", tone: "warning" };
  }
  if (r.revalidateSeconds) {
    const ageSeconds = (Date.now() - new Date(r.lastGeneratedAt).getTime()) / 1000;
    if (ageSeconds > r.revalidateSeconds) return { label: "Stale", tone: "warning" };
  }
  return { label: "Fresh", tone: "success" };
}

export default function CachePage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [pendingTag, setPendingTag] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-cache-report"],
    queryFn: fetchCacheReport,
  });
  const resources = data || [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-cache-report"] });

  const purgeMutation = useMutation({
    mutationFn: (tags) => purgeCache(tags),
    onSuccess: (_data, tags) => {
      invalidate();
      toast(tags ? `Purged ${tags.length} resource(s).` : "Purged all cached resources.", "success");
    },
    onError: (err) => toast(err.message, "error"),
    onSettled: () => setPendingTag(null),
  });

  const warmMutation = useMutation({
    mutationFn: (tags) => warmCache(tags),
    onSuccess: (_data, tags) => {
      invalidate();
      toast(tags ? `Regenerated ${tags.length} resource(s).` : "Regenerated all cached resources.", "success");
    },
    onError: (err) => toast(err.message, "error"),
    onSettled: () => setPendingTag(null),
  });

  const busy = purgeMutation.isPending || warmMutation.isPending;
  const allTags = resources.map((r) => r.tag);
  const counts = resources.reduce(
    (acc, r) => {
      const status = resourceStatus(r).label;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { Fresh: 0, Stale: 0, Purged: 0, "Never generated": 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Cache</h1>
          <p className="text-sm text-text-muted">
            Public content (homepage, nav, footer, pricing, pages, etc.) is cached on the frontend for up to a few
            minutes to avoid hitting the database on every page view. Purging a resource makes the next visit
            regenerate it; warming regenerates it right now instead of waiting for a visitor.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setPendingTag("*");
              warmMutation.mutate(allTags);
            }}
            disabled={busy || allTags.length === 0}
          >
            <Zap size={16} />
            Warm all
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setPendingTag("*");
              purgeMutation.mutate(allTags);
            }}
            disabled={busy || allTags.length === 0}
          >
            <Trash2 size={16} />
            Purge all
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatTile label="Fresh" value={counts.Fresh} />
        <StatTile label="Stale" value={counts.Stale} />
        <StatTile label="Purged" value={counts.Purged} />
        <StatTile label="Never generated" value={counts["Never generated"]} />
      </div>

      <Card>
        {isLoading ? (
          <div className="p-5 text-text-muted">Loading…</div>
        ) : resources.length === 0 ? (
          <EmptyState title="Nothing to show" description="No cacheable resources were reported." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Resource</Th>
                <Th>Status</Th>
                <Th>Last generated</Th>
                <Th>Refreshes every</Th>
                <Th>Last check</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {resources.map((r) => {
                const status = resourceStatus(r);
                const rowBusy = busy && pendingTag === r.tag;
                return (
                  <Tr key={r.tag}>
                    <Td className="font-medium">{r.label}</Td>
                    <Td>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </Td>
                    <Td className="text-text-muted">{formatDateTime(r.lastGeneratedAt)}</Td>
                    <Td className="text-text-muted">
                      {r.revalidateSeconds ? `${Math.round(r.revalidateSeconds / 60)} min` : "—"}
                    </Td>
                    <Td className="text-text-muted">
                      {r.lastElapsedMs != null ? (
                        <span title="Estimated from response time — Next.js doesn't expose a direct hit/miss signal.">
                          {r.lastStatus} · {r.lastElapsedMs}ms
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <IconButton
                          label="Regenerate now"
                          icon={RotateCw}
                          disabled={busy}
                          onClick={() => {
                            setPendingTag(r.tag);
                            warmMutation.mutate([r.tag]);
                          }}
                        />
                        <IconButton
                          label="Purge"
                          icon={Trash2}
                          disabled={busy}
                          onClick={() => {
                            setPendingTag(r.tag);
                            purgeMutation.mutate([r.tag]);
                          }}
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
    </div>
  );
}
