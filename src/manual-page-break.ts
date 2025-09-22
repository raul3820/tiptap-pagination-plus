import { Node, Editor } from "@tiptap/core";

export interface ManualPageBreakOptions {
  HTMLAttributes: Record<string, string | number | boolean>;
}

// Utility function to calculate remaining page height
function calculateRemainingPageHeight(editor: Editor): number | null {
  console.log('🔍 [ManualPageBreak] Starting height calculation...');

  if (!editor || !editor.view) {
    console.log('❌ [ManualPageBreak] No editor or editor.view available');
    return null;
  }

  try {
    const paginationExtension = editor.extensionManager.extensions.find(
      (ext: { name: string }) => ext.name === 'PaginationPlus'
    );

    console.log('🔍 [ManualPageBreak] Pagination extension found:', paginationExtension?.name);

    if (!paginationExtension || !paginationExtension.options) {
      console.log('❌ [ManualPageBreak] No pagination extension or options found');
      return null;
    }

    const options = paginationExtension.options;
    const editorDom = editor.view.dom;

    console.log('📐 [ManualPageBreak] Page configuration:', {
      pageHeight: options.pageHeight,
      pageHeaderHeight: options.pageHeaderHeight,
      pageFooterHeight: options.pageFooterHeight,
      marginTop: options.marginTop,
      marginBottom: options.marginBottom,
      contentMarginTop: options.contentMarginTop,
      contentMarginBottom: options.contentMarginBottom
    });

    // Calculate available content area height
    const pageHeaderHeight = options.pageHeaderHeight + options.contentMarginTop + options.marginTop;
    const pageFooterHeight = options.pageFooterHeight + options.contentMarginBottom + options.marginBottom;
    const pageContentAreaHeight = options.pageHeight - pageHeaderHeight - pageFooterHeight;

    console.log('📐 [ManualPageBreak] Calculated dimensions:', {
      pageHeaderHeight,
      pageFooterHeight,
      pageContentAreaHeight
    });

    // Find the page break element that contains this position
    const paginationElement = editorDom.querySelector("[data-rm-pagination]");
    if (!paginationElement) {
      console.log('❌ [ManualPageBreak] No pagination element found');
      return null;
    }

    // Get all page breaks to determine which page we're on
    const pageBreaks = paginationElement.querySelectorAll(".breaker");
    console.log('🔍 [ManualPageBreak] Found page breaks:', pageBreaks.length);

    // Get the current page's content height
    const currentPageBreak = pageBreaks[pageBreaks.length - 1] as HTMLElement;
    if (!currentPageBreak) {
      console.log('❌ [ManualPageBreak] No current page break found');
      return null;
    }

    // Calculate how much space is left on the current page
    const pageTop = currentPageBreak.offsetTop;
    console.log('📍 [ManualPageBreak] Current page break position:', {
      pageTop,
      currentPageBreak: {
        offsetTop: currentPageBreak.offsetTop,
        offsetHeight: currentPageBreak.offsetHeight
      }
    });

    // Get the editor content height
    const editorContentHeight = editorDom.scrollHeight;
    const usedSpace = editorContentHeight - pageTop;
    const remainingSpace = pageContentAreaHeight - usedSpace;

    console.log('📐 [ManualPageBreak] Space calculations:', {
      editorContentHeight,
      usedSpace,
      remainingSpace
    });

    // Return remaining space minus some padding for the manual page break content
    const finalHeight = Math.max(remainingSpace - 60, 50); // 60px for padding, min 50px
    console.log('✅ [ManualPageBreak] Final calculated height:', finalHeight, 'px');

    return finalHeight;
  } catch (error) {
    console.warn('❌ [ManualPageBreak] Error calculating remaining page height:', error);
    return null;
  }
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
  
  calculateRemainingPageHeight() {
    if (!this.editor || !this.editor.view) return null;

    try {
      const paginationExtension = this.editor.extensionManager.extensions.find(
        (ext: { name: string }) => ext.name === 'PaginationPlus'
      );

      if (!paginationExtension || !paginationExtension.options) {
        return null;
      }

      const options = paginationExtension.options;
      const editorDom = this.editor.view.dom;

      // Calculate available content area height
      const pageHeaderHeight = options.pageHeaderHeight + options.contentMarginTop + options.marginTop;
      const pageFooterHeight = options.pageFooterHeight + options.contentMarginBottom + options.marginBottom;
      const pageContentAreaHeight = options.pageHeight - pageHeaderHeight - pageFooterHeight;

      // Find the page break element that contains this position
      const paginationElement = editorDom.querySelector("[data-rm-pagination]");
      if (!paginationElement) return null;

      // Get all page breaks to determine which page we're on
      const pageBreaks = paginationElement.querySelectorAll(".breaker");

      // Get the current page's content height
      const currentPageBreak = pageBreaks[pageBreaks.length - 1] as HTMLElement;
      if (!currentPageBreak) return null;

      // Calculate how much space is left on the current page
      const pageTop = currentPageBreak.offsetTop;

      // Get the editor content height
      const editorContentHeight = editorDom.scrollHeight;
      const usedSpace = editorContentHeight - pageTop;
      const remainingSpace = pageContentAreaHeight - usedSpace;

      // Return remaining space minus some padding for the manual page break content
      return Math.max(remainingSpace - 60, 50); // 60px for padding, min 50px
    } catch (error) {
      console.warn('Error calculating remaining page height:', error);
      return null;
    }
  },

  parseHTML() {
    return [
      {
        tag: "div.manual-page-break-node",
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, string | number | boolean> }) {
    // Calculate dynamic height to fill remaining page space
    console.log('🎨 [ManualPageBreak] Rendering HTML for manual page break...');
    const dynamicHeight = this.editor ? calculateRemainingPageHeight(this.editor) : null;
    console.log('📏 [ManualPageBreak] RenderHTML calculated height:', dynamicHeight);

    return [
      "div",
      {
        ...HTMLAttributes,
        style: `
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          margin: 0;
          border: 1px dashed #ccc;
          background-color: #f9f9f9;
          color: #666;
          font-size: 12px;
          border-radius: 4px;
          min-height: 50px;
          ${dynamicHeight ? `height: ${dynamicHeight}px;` : ''}
        `,
        "data-manual-page-break": "true",
      },
      [
        "span",
        {
          style: "display: flex; align-items: center; gap: 8px; z-index: 1; position: relative;",
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

  addNodeView() {
    return ({ node, getPos: _getPos }) => {
      const dom = document.createElement('div');
      const content = document.createElement('span');

      dom.className = 'manual-page-break-node';
      dom.setAttribute('data-manual-page-break', 'true');
      dom.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        margin: 0;
        border: 1px dashed #ccc;
        background-color: #f9f9f9;
        color: #666;
        font-size: 12px;
        border-radius: 4px;
        min-height: 50px;
        position: relative;
        width: 100%;
      `;

      content.style.cssText = 'display: flex; align-items: center; gap: 8px; z-index: 1; position: relative;';
      content.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v18M3 12h6a3 3 0 0 0 3-3V3M15 12h6a3 3 0 0 1 3 3v6"></path>
        </svg>
        <span>Manual Page Break</span>
      `;

      dom.appendChild(content);

      // Update height dynamically when the editor changes
      const updateHeight = () => {
        console.log('🔄 [ManualPageBreak] Updating height for node view...');
        const height = calculateRemainingPageHeight(this.editor);
        console.log('📏 [ManualPageBreak] Node view calculated height:', height);

        if (height && height > 50) {
          console.log('✅ [ManualPageBreak] Applying height to DOM element:', height, 'px');
          dom.style.height = `${height}px`;
          dom.style.minHeight = `${height}px`;
        } else {
          console.log('⚠️ [ManualPageBreak] Height too small or null, keeping min-height');
        }
      };

      // Initial height calculation
      updateHeight();

      // Set up observer for editor changes
      if (this.editor && this.editor.view) {
        console.log('👀 [ManualPageBreak] Setting up mutation observer...');
        const observer = new MutationObserver((mutations) => {
          console.log('🔄 [ManualPageBreak] Mutation observed:', mutations.length, 'changes');
          updateHeight();
        });
        observer.observe(this.editor.view.dom, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class']
        });

        // Also listen for editor updates
        console.log('📡 [ManualPageBreak] Setting up editor update listener...');
        this.editor.on('update', (_update) => {
          console.log('📝 [ManualPageBreak] Editor update event triggered');
          updateHeight();
        });
      } else {
        console.log('❌ [ManualPageBreak] No editor or editor.view available for observers');
      }

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false;
          updateHeight();
          return true;
        },
        destroy: () => {
          if (this.editor) {
            this.editor.off('update', updateHeight);
          }
        }
      };
    };
  },


});