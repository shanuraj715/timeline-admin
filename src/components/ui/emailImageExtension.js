import Image from "@tiptap/extension-image";

// Extends the base Image node with `width` (a CSS width value, e.g. "50%")
// and `align` (left/center/right) attributes, rendered as inline styles on
// the <img> tag itself rather than a class — most email clients strip
// <style> blocks and many strip classes entirely, so the size/alignment
// has to be baked into the tag's own style attribute to survive into the
// email that's actually sent, not just look right in this editor's preview.
// data-width/data-align are also written out (redundant with the inline
// style) purely so parseHTML can read them back losslessly when reloading
// previously-saved content into the editor.
export const EmailImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element) => element.getAttribute("data-width") || "100%",
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { width, align, ...rest } = HTMLAttributes;
    const margin = align === "left" ? "margin:0 auto 0 0;" : align === "right" ? "margin:0 0 0 auto;" : "margin:0 auto;";
    return [
      "img",
      {
        ...rest,
        "data-width": width,
        "data-align": align,
        style: `display:block;max-width:100%;width:${width};height:auto;${margin}`,
      },
    ];
  },
});

export const IMAGE_SIZES = [
  { label: "S", value: "25%" },
  { label: "M", value: "50%" },
  { label: "L", value: "75%" },
  { label: "Full", value: "100%" },
];

export const IMAGE_ALIGNS = ["left", "center", "right"];
