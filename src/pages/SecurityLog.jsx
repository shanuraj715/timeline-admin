import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { fetchSecurityLog, fetchSecurityLogActions } from "../api/admin";
import { Card } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";

const SEVERE_ACTIONS = new Set(["login_blocked_locked", "refresh_token_reuse_detected", "change_password_failed"]);
const EMPTY_FILTERS = { userEmail: "", action: "", ip: "", dateFrom: "", dateTo: "" };

function formatDate(d) {
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SecurityLog() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const { data: actions = [] } = useQuery({
    queryKey: ["admin-security-log-actions"],
    queryFn: fetchSecurityLogActions,
  });

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["admin-security-log", filters],
    queryFn: ({ pageParam }) => fetchSecurityLog({ ...filters, cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
  });

  const events = data?.pages.flatMap((p) => p.events) || [];
  const hasActiveFilters = Object.values(filters).some(Boolean);

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text">Security log</h1>
        <p className="text-sm text-text-muted">Recent authentication and account-security events.</p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Input
            label="User"
            placeholder="Name or email…"
            value={filters.userEmail}
            onChange={(e) => updateFilter("userEmail", e.target.value)}
          />
          <Select label="Event" value={filters.action} onChange={(e) => updateFilter("action", e.target.value)}>
            <option value="">All events</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
          <Input label="IP" placeholder="e.g. 192.168…" value={filters.ip} onChange={(e) => updateFilter("ip", e.target.value)} />
          <Input
            label="From"
            type="datetime-local"
            value={filters.dateFrom}
            onChange={(e) => updateFilter("dateFrom", e.target.value)}
          />
          <Input
            label="To"
            type="datetime-local"
            value={filters.dateTo}
            onChange={(e) => updateFilter("dateTo", e.target.value)}
          />
        </div>
        {hasActiveFilters && (
          <div className="mt-3">
            <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear filters
            </Button>
          </div>
        )}
      </Card>

      <Card>
        {isLoading ? (
          <div className="p-5 text-text-muted">Loading…</div>
        ) : events.length === 0 ? (
          <EmptyState
            title="No security events found"
            description={hasActiveFilters ? "Try different filters." : undefined}
          />
        ) : (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Event</Th>
                  <Th>User</Th>
                  <Th>IP</Th>
                  <Th>Date</Th>
                </Tr>
              </Thead>
              <Tbody>
                {events.map((e) => (
                  <Tr key={e.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        {SEVERE_ACTIONS.has(e.action) && <AlertTriangle size={14} className="text-danger" />}
                        <Badge tone={SEVERE_ACTIONS.has(e.action) ? "danger" : "neutral"}>
                          {e.action.replaceAll("_", " ")}
                        </Badge>
                      </div>
                    </Td>
                    <Td className="text-text-muted">{e.user?.email || "Unknown user"}</Td>
                    <Td className="text-text-muted">{e.ip}</Td>
                    <Td className="text-text-muted">{formatDate(e.createdAt)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {hasNextPage && (
              <div className="flex justify-center border-t border-border py-3">
                <Button variant="secondary" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
