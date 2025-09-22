import { Node } from "@tiptap/core";

export interface ManualPageBreakOptions {
  HTMLAttributes: Record<string, string | number | boolean>;
}

export const ManualPageBreak = Node.create<ManualPageBreakOptions>({
  name: "manualPageBreak",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: "manual-page-break-node",
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () => {
        // Insert a manual page break when Ctrl+Enter (or Cmd+Enter on Mac) is pressed
        this.editor.commands.insertContent({
          type: "manualPageBreak",
        });
        return true;
      },
    };
  },

  addAttributes() {
    return {
      class: {
        default: "manual-page-break-node",
        renderHTML: (attributes) => ({
          class: attributes.class,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div.manual-page-break-node",
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return [
      "div",
      {
        ...HTMLAttributes,
        style: `
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          margin: 20px 0;
          border: 1px dashed #ccc;
          background-color: #f9f9f9;
          color: #666;
          font-size: 12px;
          border-radius: 4px;
        `,
        "data-manual-page-break": "true",
      },
      [
        "span",
        {
          style: "display: flex; align-items: center; gap: 8px;",
        },
        [
          "svg",
          {
            width: "16",
            height: "16",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
          },
          [
            "path",
            {
              d: "M12 3v18M3 12h6a3 3 0 0 0 3-3V3M15 12h6a3 3 0 0 1 3 3v6",
            },
          ],
        ],
        ["span", {}, "Manual Page Break"],
      ],
    ];
  },

});