import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GalleryHorizontalEnd, HardDrive, Unlock, Coins, ShieldCheck, ShieldOff, UserRound } from "lucide-react";
import { fetchUsers, adjustUserCredits } from "../api/users";
import { runUserAction, fetchUserTimelines } from "../api/admin";
import { Card } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { Input, Textarea } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Modal } from "../components/ui/Modal";
import { StorageQuotaModal, formatBytes } from "../components/StorageQuotaModal";
import { useToast } from "../context/ToastContext";

const LIMIT = 20;

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Users() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [profileTarget, setProfileTarget] = useState(null);
  const [timelinesTarget, setTimelinesTarget] = useState(null);
  const [roleActionTarget, setRoleActionTarget] = useState(null); // { user, action: "promote" | "demote" }
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", q, page],
    queryFn: () => fetchUsers({ q, page, limit: LIMIT }),
  });
  const users = data?.users || [];

  const actionMutation = useMutation({
    mutationFn: ({ id, action }) => runUserAction(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast("Updated", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, action }) => runUserAction(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast("Role updated", "success");
      setRoleActionTarget(null);
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Users</h1>
          <p className="text-sm text-text-muted">Search accounts and adjust credit balances manually.</p>
        </div>
        <Input
          placeholder="Search by name or email…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="w-64"
        />
      </div>

      <Card>
        {isLoading ? (
          <div className="p-5 text-text-muted">Loading…</div>
        ) : users.length === 0 ? (
          <EmptyState title="No users found" description="Try a different search." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Credits</Th>
                <Th>Status</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {users.map((u) => (
                <Tr key={u.id}>
                  <Td className="font-medium">{u.name}</Td>
                  <Td className="text-text-muted">{u.email}</Td>
                  <Td>
                    <Badge tone={u.role === "superadmin" ? "primary" : "neutral"}>{u.role}</Badge>
                  </Td>
                  <Td>{u.credits}</Td>
                  <Td>{u.isLocked && <Badge tone="danger">Locked</Badge>}</Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      {u.isLocked && (
                        <IconButton
                          label="Unlock account"
                          icon={Unlock}
                          onClick={() => actionMutation.mutate({ id: u.id, action: "unlock" })}
                          disabled={actionMutation.isPending}
                        />
                      )}
                      <IconButton label="View profile" icon={UserRound} onClick={() => setProfileTarget(u)} />
                      <IconButton
                        label="View timelines"
                        icon={GalleryHorizontalEnd}
                        onClick={() => setTimelinesTarget(u)}
                      />
                      <IconButton label="Adjust credits" icon={Coins} onClick={() => setAdjustTarget(u)} />
                      <IconButton
                        label={u.role === "superadmin" ? "Demote to regular user" : "Promote to superadmin"}
                        icon={u.role === "superadmin" ? ShieldOff : ShieldCheck}
                        onClick={() =>
                          setRoleActionTarget({ user: u, action: u.role === "superadmin" ? "demote" : "promote" })
                        }
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        {data && <Pagination page={data.page} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>

      {adjustTarget && <AdjustCreditsModal user={adjustTarget} onClose={() => setAdjustTarget(null)} />}
      {profileTarget && <UserProfileModal user={profileTarget} onClose={() => setProfileTarget(null)} />}
      {timelinesTarget && <UserTimelinesModal user={timelinesTarget} onClose={() => setTimelinesTarget(null)} />}
      {roleActionTarget && (
        <Modal
          open
          onClose={() => setRoleActionTarget(null)}
          title={roleActionTarget.action === "promote" ? "Promote to superadmin" : "Demote to regular user"}
          footer={
            <>
              <Button variant="secondary" onClick={() => setRoleActionTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => roleMutation.mutate({ id: roleActionTarget.user.id, action: roleActionTarget.action })}
                disabled={roleMutation.isPending}
              >
                {roleActionTarget.action === "promote" ? "Promote" : "Demote"}
              </Button>
            </>
          }
        >
          <p className="text-sm text-text">
            {roleActionTarget.action === "promote" ? (
              <>
                Give <strong>{roleActionTarget.user.email}</strong> full superadmin access to this admin panel,
                including billing, user management, and platform settings?
              </>
            ) : (
              <>
                Remove superadmin access from <strong>{roleActionTarget.user.email}</strong>? This immediately signs
                them out of every active session.
              </>
            )}
          </p>
        </Modal>
      )}
    </div>
  );
}

const GENDER_LABELS = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

// Read-only — these fields are collected at registration (see the
// (auth)/register page) and aren't editable from here. Kept out of the main
// table entirely (no new columns) since they're not what admins scan a
// user list for; visible only when they drill into one specific account.
function ProfileRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm font-medium text-text">{value || "—"}</span>
    </div>
  );
}

function UserProfileModal({ user, onClose }) {
  return (
    <Modal
      open
      onClose={onClose}
      title={`Profile — ${user.name}`}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="flex flex-col">
        <ProfileRow label="Email" value={user.email} />
        <ProfileRow label="Date of birth" value={user.dob ? formatDate(user.dob) : null} />
        <ProfileRow label="Gender" value={user.gender ? GENDER_LABELS[user.gender] || user.gender : null} />
        <ProfileRow label="Phone" value={user.phone} />
        <ProfileRow label="Country" value={user.country} />
        <ProfileRow label="Account created" value={formatDate(user.createdAt)} />
      </div>
      {!user.dob && !user.gender && !user.phone && !user.country && (
        <p className="mt-3 text-xs text-text-muted">
          No profile details on file — this account predates the expanded registration form.
        </p>
      )}
    </Modal>
  );
}

function AdjustCreditsModal({ user, onClose }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () => adjustUserCredits(user.id, { amount: Number(amount), reason }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast(`Balance updated to ${data.credits} credits`, "success");
      onClose();
    },
    onError: (err) => toast(err.message, "error"),
  });

  const parsedAmount = Number(amount);
  const isValid = amount !== "" && Number.isInteger(parsedAmount) && parsedAmount !== 0;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Adjust credits — ${user.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!isValid || mutation.isPending}>
            Apply
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">
          Current balance: <strong className="text-text">{user.credits} credits</strong>
        </p>
        <Input
          label="Amount"
          type="number"
          placeholder="e.g. 50 or -20"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <p className="text-xs text-text-muted">Positive adds credits, negative subtracts (floored at 0).</p>
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

// Deliberately shows no timeline title/slug and no media/asset previews —
// see the /users/:id/timelines route's own comment. Just enough to answer
// "how many timelines, how big, how active" for support/moderation. The
// per-row Storage button still works even without a title, since the
// shared StorageQuotaModal takes a generic label instead of the timeline's
// own title.
function UserTimelinesModal({ user, onClose }) {
  const { data: timelines = [], isLoading } = useQuery({
    queryKey: ["admin-user-timelines", user.id],
    queryFn: () => fetchUserTimelines(user.id),
  });
  const [storageTarget, setStorageTarget] = useState(null);

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`Timelines — ${user.name}`}
        width="720px"
        footer={
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        }
      >
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : timelines.length === 0 ? (
          <p className="text-sm text-text-muted">This user isn't a member of any timeline.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-text-muted">
              Names and content are hidden here by design — this is metadata only.
            </p>
            <Table>
              <Thead>
                <Tr>
                  <Th>Role</Th>
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
                    <Td className="capitalize">{t.role}</Td>
                    <Td>{t.memberCount}</Td>
                    <Td>{t.mediaCount}</Td>
                    <Td className="text-text-muted">
                      {formatBytes(t.usedBytes)} / {formatBytes(t.quotaBytes)}
                    </Td>
                    <Td className="text-text-muted">{formatDate(t.createdAt)}</Td>
                    <Td>
                      <IconButton label="Manage storage quota" icon={HardDrive} onClick={() => setStorageTarget(t)} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        )}
      </Modal>

      {storageTarget && (
        <StorageQuotaModal
          timeline={storageTarget}
          title="Timeline storage"
          invalidateKeys={[["admin-user-timelines", user.id]]}
          onClose={() => setStorageTarget(null)}
        />
      )}
    </>
  );
}
