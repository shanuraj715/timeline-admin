import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import {
  Heading1,
  Heading2,
  Bold,
  Italic,
  UnderlineIcon,
  List,
  ListOrdered,
  LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Image as ImageIcon,
  Code2,
  Eye,
} from "lucide-react";
import { EmailImage, IMAGE_SIZES, IMAGE_ALIGNS } from "./emailImageExtension";
import { uploadEmailTemplateImage } from "../../api/emailTemplates";
import { useToast } from "../../context/ToastContext";

// Mirrors RichTextEditor.jsx's structure and visual language (same
// ToolbarButton/ToolbarDivider shape, same Visual/HTML mode toggle,
// controlled value/onChange) but is its own component rather than a shared
// one: email HTML has a different, narrower set of things that actually
// survive into an inbox — no video/YouTube embeds (most clients strip
// <video>/<iframe> outright), and images need the width/align controls
// this editor's EmailImage extension adds, neither of which apply to CMS
// page content.
function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: 30,
        width: 30,
        borderRadius: 6,
        border: "none",
        background: active ? "var(--primary)" : "transparent",
        color: active ? "var(--primary-fg)" : "var(--text)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
      className={disabled ? "" : "hover:bg-surface-hover"}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div style={{ width: 1, background: "var(--border)", margin: "4px 4px" }} />;
}

// forwardRef so the parent (EmailTemplates.jsx's TemplateModal, which also
// owns a plain Subject <Input> outside this component) can insert a
// `{variable}` token into whichever of the two editing surfaces here —
// visual editor or raw HTML textarea — is actually active, without needing
// to know which one that is or reach into TipTap's internals itself.
export const EmailRichTextEditor = forwardRef(function EmailRichTextEditor({ value, onChange }, ref) {
  const [mode, setMode] = useState("visual"); // "visual" | "html"
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef(null);
  const htmlTextareaRef = useRef(null);
  const toast = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true }),
      EmailImage,
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        style: "min-height: 320px; padding: 12px 14px; outline: none;",
      },
    },
  });

  // Keep the editor in sync when `value` changes externally — loading an
  // existing template, or switching back from HTML mode where edits only
  // touched the raw textarea. Skipped while HTML mode is showing so every
  // keystroke there doesn't trigger a full re-parse of a hidden editor.
  useEffect(() => {
    if (!editor || mode === "html") return;
    const current = editor.getHTML();
    if (value !== current && value !== undefined) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value, mode]);

  useImperativeHandle(
    ref,
    () => ({
      insertVariable(name) {
        const token = `{${name}}`;
        if (mode === "visual") {
          editor?.chain().focus().insertContent(token).run();
          return;
        }
        const el = htmlTextareaRef.current;
        const current = value || "";
        if (!el) {
          onChange(current + token);
          return;
        }
        const start = el.selectionStart ?? current.length;
        const end = el.selectionEnd ?? current.length;
        onChange(current.slice(0, start) + token + current.slice(end));
        requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(start + token.length, start + token.length);
        });
      },
    }),
    [mode, editor, value, onChange]
  );

  if (!editor) return null;

  function setLink() {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("URL", previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  async function handleUpload(file) {
    setUploading(true);
    try {
      const { url } = await uploadEmailTemplateImage(file);
      editor.chain().focus().setImage({ src: url, width: "100%", align: "center" }).run();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          padding: 6,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {mode === "visual" && (
          <>
            <ToolbarButton
              title="Heading 1"
              active={editor.isActive("heading", { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 size={16} />
            </ToolbarButton>
            <ToolbarButton
              title="Heading 2"
              active={editor.isActive("heading", { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 size={16} />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold size={16} />
            </ToolbarButton>
            <ToolbarButton
              title="Italic"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic size={16} />
            </ToolbarButton>
            <ToolbarButton
              title="Underline"
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon size={16} />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              title="Align left"
              active={editor.isActive({ textAlign: "left" })}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
            >
              <AlignLeft size={16} />
            </ToolbarButton>
            <ToolbarButton
              title="Align center"
              active={editor.isActive({ textAlign: "center" })}
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
            >
              <AlignCenter size={16} />
            </ToolbarButton>
            <ToolbarButton
              title="Align right"
              active={editor.isActive({ textAlign: "right" })}
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
            >
              <AlignRight size={16} />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              title="Bullet list"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List size={16} />
            </ToolbarButton>
            <ToolbarButton
              title="Numbered list"
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered size={16} />
            </ToolbarButton>
            <ToolbarButton title="Link" active={editor.isActive("link")} onClick={setLink}>
              <LinkIcon size={16} />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton title="Insert image" disabled={uploading} onClick={() => imageInputRef.current?.click()}>
              <ImageIcon size={16} />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
              <Undo size={16} />
            </ToolbarButton>
            <ToolbarButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
              <Redo size={16} />
            </ToolbarButton>
          </>
        )}

        {mode === "html" && (
          <span style={{ fontSize: 12, color: "var(--text-muted)", padding: "0 4px" }}>
            Editing raw HTML — email clients only render inline styles, not &lt;style&gt; blocks or classes.
          </span>
        )}

        <span style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
          <ToolbarButton title="Visual editor" active={mode === "visual"} onClick={() => setMode("visual")}>
            <Eye size={16} />
          </ToolbarButton>
          <ToolbarButton title="Edit raw HTML" active={mode === "html"} onClick={() => setMode("html")}>
            <Code2 size={16} />
          </ToolbarButton>
        </span>
      </div>

      {mode === "visual" ? (
        <>
          <BubbleMenu editor={editor} shouldShow={({ editor }) => editor.isActive("image")}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: 4,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                boxShadow: "var(--shadow)",
              }}
            >
              {IMAGE_SIZES.map((s) => (
                <ToolbarButton
                  key={s.value}
                  title={`Size: ${s.label}`}
                  active={editor.getAttributes("image").width === s.value}
                  onClick={() => editor.chain().focus().updateAttributes("image", { width: s.value }).run()}
                >
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{s.label}</span>
                </ToolbarButton>
              ))}
              <ToolbarDivider />
              {IMAGE_ALIGNS.map((a) => {
                const Icon = a === "left" ? AlignLeft : a === "right" ? AlignRight : AlignCenter;
                return (
                  <ToolbarButton
                    key={a}
                    title={`Align ${a}`}
                    active={editor.getAttributes("image").align === a}
                    onClick={() => editor.chain().focus().updateAttributes("image", { align: a }).run()}
                  >
                    <Icon size={16} />
                  </ToolbarButton>
                );
              })}
            </div>
          </BubbleMenu>
          <EditorContent editor={editor} className="rich-text-content" />
        </>
      ) : (
        <textarea
          ref={htmlTextareaRef}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          style={{
            width: "100%",
            minHeight: 320,
            padding: "12px 14px",
            border: "none",
            outline: "none",
            resize: "vertical",
            background: "transparent",
            color: "var(--text)",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        />
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
});
