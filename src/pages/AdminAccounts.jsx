import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { fetchAdminAccounts, grantAdminAccess, updateAdminPermissions, revokeAdminAccess } from "../api/adminAccounts";
import { Card } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Input, Checkbox } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { PERMISSION_GROUPS, hasPermission } from "../lib/permissions";

export default function AdminAccounts() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user: caller } = useAuth();
  const [grantOpen, setGrantOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["admin-accounts"],
    queryFn: fetchAdminAccounts,
  });

  const revokeMutation = useMutation({
    mutationFn: (id) => revokeAdminAccess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      toast("Admin access revoked", "success");
      setRevokeTarget(null);
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Admins</h1>
          <p className="text-sm text-text-muted">Grant admin access and manage what each account can do.</p>
        </div>
        <Button onClick={() => setGrantOpen(true)}>
          <UserPlus size={16} />
          Grant admin access
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-5 text-text-muted">Loading…</div>
        ) : accounts.length === 0 ? (
          <EmptyState title="No admin accounts" />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Permissions</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {accounts.map((a) => (
                <Tr key={a.id}>
                  <Td className="font-medium">{a.name}</Td>
                  <Td className="text-text-muted">{a.email}</Td>
                  <Td>
                    <Badge tone={a.role === "superadmin" ? "primary" : "neutral"}>{a.role}</Badge>
                  </Td>
                  <Td>
                    {a.role === "superadmin" ? (
                      <span className="text-text-muted">Everything</span>
                    ) : (
                      <div className="flex max-w-md flex-wrap gap-1">
                        {a.permissions.length === 0 ? (
                          <span className="text-text-muted">None</span>
                        ) : (
                          a.permissions.map((p) => (
                            <Badge key={p} tone="neutral">
                              {p}
                            </Badge>
                          ))
                        )}
                      </div>
                    )}
                  </Td>
                  <Td>
                    {a.canManage && (
                      <div className="flex justify-end gap-2">
                        <IconButton label="Edit permissions" icon={Pencil} onClick={() => setEditTarget(a)} />
                        <IconButton
                          label="Revoke admin access"
                          icon={Trash2}
                          variant="danger"
                          onClick={() => setRevokeTarget(a)}
                        />
                      </div>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {grantOpen && <GrantAccessModal caller={caller} onClose={() => setGrantOpen(false)} />}
      {editTarget && <EditPermissionsModal caller={caller} account={editTarget} onClose={() => setEditTarget(null)} />}
      {revokeTarget && (
        <Modal
          open
          onClose={() => setRevokeTarget(null)}
          title="Revoke admin access"
          footer={
            <>
              <Button variant="secondary" onClick={() => setRevokeTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => revokeMutation.mutate(revokeTarget.id)} disabled={revokeMutation.isPending}>
                Revoke
              </Button>
            </>
          }
        >
          <p className="text-sm text-text">
            Remove admin access from <strong>{revokeTarget.email}</strong>? This immediately signs them out of every
            active session and returns their account to a regular user.
          </p>
        </Modal>
      )}
    </div>
  );
}

// Shared by the grant and edit modals — a checkbox per permission key,
// grouped the same way the sidebar/tabs are. Anything the caller doesn't
// themselves hold is disabled client-side (the backend independently
// enforces the same subset rule, so this is a UX nicety, not the real gate).
function PermissionCheckboxes({ caller, selected, onChange }) {
  const callerIsSuperadmin = caller?.role === "superadmin";

  function toggle(key) {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  }

  return (
    <div className="flex flex-col gap-4">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.key}>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">{group.label}</p>
          <div className="flex flex-col gap-1.5">
            {group.permissions.map((p) => {
              const callerHasIt = callerIsSuperadmin || hasPermission(caller, p.key);
              return (
                <Checkbox
                  key={p.key}
                  label={p.label}
                  checked={selected.includes(p.key)}
                  disabled={!callerHasIt}
                  onChange={() => toggle(p.key)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function GrantAccessModal({ caller, onClose }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState([]);

  const mutation = useMutation({
    mutationFn: () => grantAdminAccess({ email, name: name || undefined, password: password || undefined, permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      toast("Admin access granted", "success");
      onClose();
    },
    onError: (err) => toast(err.message, "error"),
  });

  const isValid = email.trim().length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title="Grant admin access"
      width="520px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!isValid || mutation.isPending}>
            Grant access
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="person@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="-mt-2 text-xs text-text-muted">
          If this email already has an account, it's promoted to admin with the permissions below. Otherwise a new
          account is created — fill in a name and password for it.
        </p>
        <Input label="Name (new account only)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Password (new account only)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PermissionCheckboxes caller={caller} selected={permissions} onChange={setPermissions} />
      </div>
    </Modal>
  );
}

function EditPermissionsModal({ caller, account, onClose }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [permissions, setPermissions] = useState(account.permissions);

  const mutation = useMutation({
    mutationFn: () => updateAdminPermissions(account.id, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      toast("Permissions updated", "success");
      onClose();
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit permissions — ${account.email}`}
      width="520px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            Save
          </Button>
        </>
      }
    >
      <PermissionCheckboxes caller={caller} selected={permissions} onChange={setPermissions} />
    </Modal>
  );
}
