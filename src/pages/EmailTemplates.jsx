import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Variable, Eye, Send } from "lucide-react";
import {
  fetchEmailTemplates,
  updateEmailTemplate,
  previewEmailTemplate,
  testEmailTemplate,
} from "../api/emailTemplates";
import { Card, CardBody } from "../components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Input } from "../components/ui/Input";
import { Switch } from "../components/ui/Switch";
import { Modal } from "../components/ui/Modal";
import { EmailRichTextEditor } from "../components/ui/EmailRichTextEditor";
import { VariablesModal } from "../components/VariablesModal";
import { useToast } from "../context/ToastContext";

export default function EmailTemplates() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: fetchEmailTemplates,
  });

  const [editing, setEditing] = useState(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["email-templates"] });
  }

  const toggleMutation = useMutation({
    mutationFn: ({ eventKey, isEnabled }) => updateEmailTemplate(eventKey, { isEnabled }),
    onSuccess: invalidate,
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text">Email templates</h1>
        <p className="text-sm text-text-muted">
          These fire automatically from real events in the app — a disabled template just silently doesn't send.
        </p>
      </div>

      <Card>
        {isLoading ? (
          <CardBody>Loading…</CardBody>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Event key</Th>
                <Th>Subject</Th>
                <Th>Enabled</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {templates.map((t) => (
                <Tr key={t.eventKey}>
                  <Td className="font-medium">{t.name}</Td>
                  <Td>
                    <code className="text-xs text-text-muted">{t.eventKey}</code>
                  </Td>
                  <Td className="max-w-xs truncate text-text-muted">{t.subject}</Td>
                  <Td>
                    <Switch
                      checked={t.isEnabled}
                      onChange={(isEnabled) => toggleMutation.mutate({ eventKey: t.eventKey, isEnabled })}
                    />
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <IconButton label="Edit template" icon={Pencil} onClick={() => setEditing(t)} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {editing && (
        <TemplateModal
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            invalidate();
            setEditing(null);
            toast("Template saved", "success");
          }}
        />
      )}
    </div>
  );
}

function TemplateModal({ template, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ subject: template.subject, bodyHtml: template.bodyHtml });
  const [variablesOpen, setVariablesOpen] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [preview, setPreview] = useState(null);
  const subjectElRef = useRef(null);
  const bodyEditorRef = useRef(null);
  // Defaults to "body" (the far more common target) — flips to "subject"
  // only while that field actually has focus, and back the moment focus
  // lands anywhere inside the body editor (see onFocusCapture below).
  const lastFocusedFieldRef = useRef("body");

  const saveMutation = useMutation({
    mutationFn: () => updateEmailTemplate(template.eventKey, form),
    onSuccess: onSaved,
    onError: (err) => toast(err.message, "error"),
  });

  const testMutation = useMutation({
    mutationFn: () => testEmailTemplate(template.eventKey, testTo || undefined),
    onSuccess: (d) => toast(`Test email sent to ${d.sentTo}`, "success"),
    onError: (err) => toast(err.message, "error"),
  });

  const dirty = form.subject !== template.subject || form.bodyHtml !== template.bodyHtml;

  async function refreshPreview(draft) {
    try {
      const result = await previewEmailTemplate(template.eventKey, draft);
      setPreview(result);
    } catch (err) {
      toast(err.message, "error");
    }
  }

  useEffect(() => {
    refreshPreview(form);
    // Only on mount — subsequent refreshes are explicit, via the button,
    // so an admin mid-typing doesn't get a preview flickering on every
    // keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function insertVariable(name) {
    if (lastFocusedFieldRef.current === "body") {
      bodyEditorRef.current?.insertVariable(name);
      return;
    }

    const token = `{${name}}`;
    const el = subjectElRef.current;
    setForm((f) => {
      const current = f.subject || "";
      if (el && document.body.contains(el)) {
        const start = el.selectionStart ?? current.length;
        const end = el.selectionEnd ?? current.length;
        const next = current.slice(0, start) + token + current.slice(end);
        requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(start + token.length, start + token.length);
        });
        return { ...f, subject: next };
      }
      return { ...f, subject: current + token };
    });
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={template.name}
        width="900px"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !dirty}>
              Save
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted">{template.description}</p>
              <Button size="sm" variant="secondary" onClick={() => setVariablesOpen(true)}>
                <Variable size={14} /> Variables
              </Button>
            </div>
            <Input
              label="Subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              onFocus={(e) => {
                subjectElRef.current = e.target;
                lastFocusedFieldRef.current = "subject";
              }}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text">Body</label>
              {/* onFocusCapture fires for any focus event within this
                  subtree — the editor's contentEditable area or its raw
                  HTML textarea alike — so clicking back into the body after
                  the Subject field re-targets variable insertion here
                  without EmailRichTextEditor needing its own focus prop. */}
              <div onFocusCapture={() => { lastFocusedFieldRef.current = "body"; }}>
                <EmailRichTextEditor
                  ref={bodyEditorRef}
                  value={form.bodyHtml}
                  onChange={(bodyHtml) => setForm((f) => ({ ...f, bodyHtml }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-border pt-3">
              <Input
                className="flex-1"
                placeholder="you@example.com (blank = your own email)"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
              />
              <Button size="sm" variant="secondary" onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
                <Send size={14} /> Send test
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                <Eye size={14} /> Live preview (sample data)
              </span>
              <Button size="sm" variant="secondary" onClick={() => refreshPreview(form)}>
                Refresh
              </Button>
            </div>
            {preview && <p className="truncate text-xs text-text-muted">Subject: {preview.subject}</p>}
            <iframe
              title="Email preview"
              srcDoc={preview?.html || ""}
              className="h-[420px] w-full rounded-lg border border-border bg-white"
            />
          </div>
        </div>
      </Modal>

      <VariablesModal
        open={variablesOpen}
        onClose={() => setVariablesOpen(false)}
        eventKey={template.eventKey}
        onInsert={insertVariable}
      />
    </>
  );
}
