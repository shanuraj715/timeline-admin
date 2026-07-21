import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSitemap, generateSitemap } from "../api/sitemap";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../context/ToastContext";

export default function Sitemap() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["sitemap"], queryFn: fetchSitemap });

  const generateMutation = useMutation({
    mutationFn: generateSitemap,
    onSuccess: (updated) => {
      queryClient.setQueryData(["sitemap"], updated);
      toast(`Sitemap generated — ${updated.urlCount} URLs`, "success");
    },
    onError: (err) => toast(err.message, "error"),
  });

  if (isLoading) return <div className="p-5 text-text-muted">Loading…</div>;

  const generated = Boolean(data?.generatedAt);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text">Sitemap</h1>
        <p className="text-sm text-text-muted">
          A sitemap.xml listing every public marketing page, published CMS page, and internal navigation link.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              sitemap.xml
              <Badge tone={generated ? "success" : "neutral"}>{generated ? "Generated" : "Not generated yet"}</Badge>
            </div>
          }
          description="Regenerate this after publishing or unpublishing a page, or adding/removing a navigation link, so search engines see the change."
        />
        <CardBody className="flex flex-col gap-4">
          {generated && (
            <div className="flex flex-col gap-1 text-sm text-text-muted">
              <span>
                Last generated: <span className="text-text">{new Date(data.generatedAt).toLocaleString()}</span>
              </span>
              <span>
                URLs included: <span className="text-text">{data.urlCount}</span>
              </span>
              <span>
                Live at:{" "}
                <a href={data.publicUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                  {data.publicUrl}
                </a>
              </span>
            </div>
          )}
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="self-start">
            {generated ? "Regenerate sitemap.xml" : "Generate sitemap.xml"}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
