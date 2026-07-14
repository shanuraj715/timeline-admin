import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { fetchSecurityLog } from "../api/admin";
import { Card } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";

const SEVERE_ACTIONS = new Set(["login_blocked_locked", "refresh_token_reuse_detected", "change_password_failed"]);

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
  const { data: events = [], isLoading } = useQuery({ queryKey: ["admin-security-log"], queryFn: fetchSecurityLog });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text">Security log</h1>
        <p className="text-sm text-text-muted">Recent authentication and account-security events.</p>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-5 text-text-muted">Loading…</div>
        ) : events.length === 0 ? (
          <EmptyState title="No security events yet" />
        ) : (
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
        )}
      </Card>
    </div>
  );
}
