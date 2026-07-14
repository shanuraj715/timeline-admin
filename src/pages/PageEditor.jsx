import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPage, createPage, updatePage } from "../api/cms";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Textarea, Select } from "../components/ui/Input";
import { RichTextEditor } from "../components/ui/RichTextEditor";
import { Switch } from "../components/ui/Switch";
import { useToast } from "../context/ToastContext";

const EMPTY_PAGE = {
  title: "",
  slug: "",
  content: "",
  showTitle: true,
  status: "draft",
  seoTitle: "",
  seoDescription: "",
};

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PageEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: existing } = useQuery({
    queryKey: ["page", id],
    queryFn: () => fetchPage(id),
    enabled: !isNew,
  });

  const [form, setForm] = useState(EMPTY_PAGE);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm(existing);
      setSlugTouched(true);
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: (data) => (isNew ? createPage(data) : updatePage(id, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast("Page saved", "success");
      navigate("/content#pages");
    },
    onError: (err) => toast(err.message, "error"),
  });

  function handleTitleChange(e) {
    const title = e.target.value;
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">{isNew ? "New page" : "Edit page"}</h1>
          <p className="text-sm text-text-muted">Format content with the toolbar below.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate("/content#pages")}>
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending || !form.title || !form.slug}
          >
            {saveMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Details" />
          <CardBody className="flex flex-col gap-4">
            <Input label="Title" value={form.title} onChange={handleTitleChange} />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
            <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
              <span className="text-sm text-text">Show page title on frontend</span>
              <Switch
                checked={form.showTitle ?? true}
                onChange={(showTitle) => setForm({ ...form, showTitle })}
              />
            </label>
            <Input
              label="SEO title"
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
            />
            <Textarea
              label="SEO description"
              rows={3}
              value={form.seoDescription}
              onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Content" />
          <CardBody>
            <RichTextEditor value={form.content} onChange={(html) => setForm((f) => ({ ...f, content: html }))} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
