import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchPages, deletePage } from "../api/cms";
import { Card } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, EmptyState } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";

export default function PagesList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: pages = [], isLoading } = useQuery({ queryKey: ["pages"], queryFn: fetchPages });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      setDeleteTarget(null);
      toast("Page deleted", "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Pages</h1>
          <p className="text-sm text-text-muted">Custom pages like About Us or Contact Us.</p>
        </div>
        <Button onClick={() => navigate("/pages/new")}>New page</Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-5 text-text-muted">Loading…</div>
        ) : pages.length === 0 ? (
          <EmptyState title="No pages yet" description="Create your first page." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Slug</Th>
                <Th>Status</Th>
                <Th>Updated</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {pages.map((page) => (
                <Tr key={page._id}>
                  <Td className="font-medium">{page.title}</Td>
                  <Td className="text-text-muted">/{page.slug}</Td>
                  <Td>
                    <Badge tone={page.status === "published" ? "success" : "neutral"}>{page.status}</Badge>
                  </Td>
                  <Td className="text-text-muted">{new Date(page.updatedAt).toLocaleDateString()}</Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/pages/${page._id}`)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteTarget(page)}>
                        Delete
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {deleteTarget && (
        <Modal
          open
          onClose={() => setDeleteTarget(null)}
          title="Delete page"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => deleteMutation.mutate(deleteTarget._id)} disabled={deleteMutation.isPending}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-text">
            Delete "<strong>{deleteTarget.title}</strong>"? This can't be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}
