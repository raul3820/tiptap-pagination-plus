import { Node } from '@tiptap/core';

export interface ManualPageBreakOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    manualPageBreak: {
      insertManualPageBreak: () => ReturnType;
    };
  }
}

export const ManualPageBreak = Node.create<ManualPageBreakOptions>({
  name: 'manualPageBreak',

  group: 'block',

  selectable: true,

  draggable: false,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="manual-page-break"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        'data-type': 'manual-page-break',
        class: 'rm-page-break manual-page-break',
        ...HTMLAttributes,
      },
      [
        'div',
        { class: 'page' },
      ],
      [
        'div',
        { class: 'breaker' },
        [
          'div',
          { class: 'rm-page-footer' },
          [
            'div',
            { class: 'rm-page-footer-left' },
          ],
          [
            'div',
            { class: 'rm-page-footer-right' },
            [
              'span',
              { class: 'rm-page-number' },
            ],
          ],
        ],
        [
          'div',
          { class: 'rm-pagination-gap' },
        ],
        [
          'div',
          { class: 'rm-page-header' },
          [
            'div',
            { class: 'rm-page-header-left' },
          ],
          [
            'div',
            { class: 'rm-page-header-right' },
          ],
        ],
      ],
    ];
  },

  addCommands() {
    return {
      insertManualPageBreak:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.insertManualPageBreak(),
    };
  },
});