import { Node, mergeAttributes } from "@tiptap/core";

// No official TipTap node for a plain self-hosted <video> (unlike Youtube/
// Image, which ship their own packages) — this is a small hand-rolled one.
// `atom: true` since a video has no editable rich-text content inside it,
// just attributes.
export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: null },
      height: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "video",
        getAttrs: (el) => ({
          src: el.getAttribute("src") || el.querySelector("source")?.getAttribute("src") || null,
          width: el.getAttribute("width"),
          height: el.getAttribute("height"),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(HTMLAttributes, { controls: "true" })];
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    };
  },
});
