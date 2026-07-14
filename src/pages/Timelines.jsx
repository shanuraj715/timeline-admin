import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminTimelines } from "../api/admin";
import { Card } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Input } from "../components/ui/Input";

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Timelines() {
  const [q, setQ] = useState("");
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
                <Th>Created</Th>
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
                  <Td className="text-text-muted">{formatDate(t.createdAt)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
