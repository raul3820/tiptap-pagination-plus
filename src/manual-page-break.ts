import { Node, Editor, type EditorEvents } from "@tiptap/core";

export interface ManualPageBreakOptions {
  HTMLAttributes: Record<string, string | number | boolean>;
}

interface PaginationPlusOptions {
  pageHeight: number;
  pageHeaderHeight: number;
  pageFooterHeight: number;
  marginTop: number;
  marginBottom: number;
  contentMarginTop: number;
  contentMarginBottom: number;
  pageGap: number;
}

// Utility function to calculate remaining page height FOR A SPECIFIC ELEMENT
function calculateRemainingPageHeight(editor: Editor, el: HTMLElement): number | null {
  console.log('🔍 [ManualPageBreak] Starting height calculation (per-element)...');

  if (!editor || !editor.view) {
    console.log('❌ [ManualPageBreak] No editor or editor.view available');
    return null;
  }

  try {
    const paginationExtension = editor.extensionManager.extensions.find(
      (ext: { name: string }) => ext.name === 'PaginationPlus'
    ) as { name: 'PaginationPlus'; options: PaginationPlusOptions } | undefined;

    console.log('🔍 [ManualPageBreak] Pagination extension found:', paginationExtension?.name ?? null);

    if (!paginationExtension) {
      console.log('❌ [ManualPageBreak] No pagination extension or options found');
      return null;
    }

    const options = paginationExtension.options;
    const editorDom = editor.view.dom as HTMLElement;

    console.log('📐 [ManualPageBreak] Page configuration:', {
      pageHeight: options.pageHeight,
      pageHeaderHeight: options.pageHeaderHeight,
      pageFooterHeight: options.pageFooterHeight,
      marginTop: options.marginTop,
      marginBottom: options.marginBottom,
      contentMarginTop: options.contentMarginTop,
      contentMarginBottom: options.contentMarginBottom,
    });

    // Calculate blocks and available content area height
    const headerBlock =
      options.pageHeaderHeight + options.contentMarginTop + options.marginTop;
    const footerBlock =
      options.pageFooterHeight + options.contentMarginBottom + options.marginBottom;
    const pageGap = 'pageGap' in options ? options.pageGap : 0;
    // Height of the visual breaker between pages (footer + gap + header)
    const breakerBlockHeight = footerBlock + pageGap + headerBlock;

    const pageContentAreaHeight =
      options.pageHeight - headerBlock - footerBlock;

    console.log('📐 [ManualPageBreak] Calculated dimensions:', {
      headerBlock,
      footerBlock,
      pageGap,
      breakerBlockHeight,
      pageContentAreaHeight,
    });

    // Find the pagination container for this element
    const paginationElement =
      (el.closest('[data-rm-pagination]') as HTMLElement | null) ??
      (editorDom.querySelector('[data-rm-pagination]') as HTMLElement | null);

    if (!paginationElement) {
      console.log('❌ [ManualPageBreak] No pagination element found for this node');
      return null;
    }

    // Collect page breaker positions using viewport coordinates (more robust)
    const breakers = Array.from(
      paginationElement.querySelectorAll<HTMLElement>('.breaker')
    );

    console.log('🔍 [ManualPageBreak] Found page breaks:', breakers.length);

    const breakerTops = breakers.map((b) => b.getBoundingClientRect().top);

    // Element top in viewport coordinates
    const elTop = el.getBoundingClientRect().top;

    // Determine the current page start: last breaker at or above this element
    let currentIndex = -1;
    for (let i = 0; i < breakerTops.length; i++) {
      if (breakerTops[i] <= elTop) {
        currentIndex = i;
      } else {
        break;
      }
    }

    // Determine the top of the current page content area
    const paginationTop = paginationElement.getBoundingClientRect().top;
    const pageStartTop =
      currentIndex >= 0
        ? (breakerTops[currentIndex] + breakerBlockHeight)
        : (paginationTop + headerBlock);

    console.log('📍 [ManualPageBreak] Current page start index/top:', {
      currentIndex,
      paginationTop,
      pageStartTop,
      elTop,
    });

    // Space already used on this page up to this element
    const usedSpaceOnPage = Math.max(0, elTop - pageStartTop);
    const remainingSpace = pageContentAreaHeight - usedSpaceOnPage;

    console.log('📐 [ManualPageBreak] Space calculations (per-element):', {
      usedSpaceOnPage,
      remainingSpace,
    });

    // Return remaining space minus some padding for the manual page break content
    const finalHeight = Math.max(remainingSpace - 60, 1); // 60px for padding, min 1px
    console.log('✅ [ManualPageBreak] Final calculated height:', finalHeight, 'px');

    return finalHeight;
  } catch (error) {
    console.warn('❌ [ManualPageBreak] Error calculating remaining page height:', error);
    return null;
  }
}


/**
 * Orchestrates sequential height calculation for ALL manual page break nodes.
 * Ensures earlier nodes apply their heights before later nodes are measured.
 */
const reflowScheduledByRoot = new WeakMap<HTMLElement, boolean>();
const isApplyingByRoot = new WeakMap<HTMLElement, boolean>();
const pendingReflowTimeoutByRoot = new WeakMap<HTMLElement, number | null>();

function scheduleManualPageBreakReflow(editor: Editor): void {
  if (!editor || !editor.view) {
    return;
  }

  const root = editor.view.dom as HTMLElement;

  // Debounce per-root to coalesce bursts of mutations/updates
  const existing = pendingReflowTimeoutByRoot.get(root);
  if (existing !== null && existing !== undefined) {
    window.clearTimeout(existing as number);
  }

  const timeoutId = window.setTimeout(() => {
    pendingReflowTimeoutByRoot.set(root, null);

    // Avoid overlapping reflows
    if (reflowScheduledByRoot.get(root) === true) {
      return;
    }
    reflowScheduledByRoot.set(root, true);
    isApplyingByRoot.set(root, true);

    // Two RAFs: first lets previous writes flush, second ensures layout is stable
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          const nodes: HTMLElement[] = Array.from(
            root.querySelectorAll<HTMLElement>('[data-manual-page-break="true"]')
          );

          // Sort visually by Y so earlier nodes are measured and applied first
          nodes.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

          for (const el of nodes) {
            const prevHeight = el.style.height;
            const prevMinHeight = el.style.minHeight;

            // Reset before measurement to avoid self-influence
            el.style.height = '';
            el.style.minHeight = '1px';

            const h = calculateRemainingPageHeight(editor, el);

            if (h !== null && h > 1) {
              const next = `${Math.round(h)}px`;
              // Only write when value actually changes to avoid infinite MutationObserver loops
              if (prevHeight !== next || prevMinHeight !== next) {
                el.style.height = next;
                el.style.minHeight = next;
              } else {
                // Restore original (already equal)
                el.style.height = prevHeight;
                el.style.minHeight = prevMinHeight;
              }
            } else {
              // Enforce minimum visual height; only write if different
              if (prevHeight !== '' || prevMinHeight !== '1px') {
                el.style.height = '';
                el.style.minHeight = '1px';
              } else {
                el.style.height = prevHeight;
                el.style.minHeight = prevMinHeight;
              }
            }
          }
        } finally {
          isApplyingByRoot.set(root, false);
          reflowScheduledByRoot.set(root, false);
        }
      });
    });
  }, 120);

  pendingReflowTimeoutByRoot.set(root, timeoutId);
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

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, string | number | boolean> }) {
    // Height is applied dynamically by the node view per element
    console.log('🎨 [ManualPageBreak] Rendering HTML for manual page break...');

    return [
      "div",
      {
        ...HTMLAttributes,
        style: `
          position: relative;
          padding: 0;
          margin: 0;
          border: none;
          border-top: 1px dashed;
          border-top: 1px dashed;
          border-radius: 0;
          min-height: 1px;
          height: 1px;
          overflow: hidden;
          background: repeating-linear-gradient(
            45deg,
            rgba(0, 0, 0, 0.02),
            rgba(0, 0, 0, 0.02) 12px,
            rgba(255, 255, 255, 0.02) 12px,
            rgba(255, 255, 255, 0.02) 16px
          );
        `,
        "data-manual-page-break": "true",
      },
    ];
  },

  addNodeView() {
    return ({ node, getPos: _getPos }) => {
      const dom = document.createElement('div');

      dom.className = 'manual-page-break-node';
      dom.setAttribute('data-manual-page-break', 'true');
      dom.style.cssText = `
        position: relative;
        padding: 0;
        margin: 0;
        border: none;
        border-radius: 0;
        border-top: 1px dashed;
        border-top: 1px dashed;
        min-height: 1px;
        width: 100%;
        height: 1px;
        overflow: hidden;
        background: repeating-linear-gradient(
          45deg,
          rgba(0, 0, 0, 0.02),
          rgba(0, 0, 0, 0.02) 12px,
          rgba(255, 255, 255, 0.02) 12px,
          rgba(255, 255, 255, 0.02) 16px
        );
      `;

      const triggerReflow = (): void => {
        console.log('🔄 [ManualPageBreak] Trigger reflow for all manual breaks...');
        if (!this.editor) {
          return;
        }
        scheduleManualPageBreakReflow(this.editor);
      };

      // Root-level debouncing handled inside scheduleManualPageBreakReflow

      // Initial height calculation
      triggerReflow();

      const onUpdate = (_props: EditorEvents['update']) => {
        triggerReflow();
      };
  
      // Only rely on editor update events to schedule reflow.
      // Avoid observing DOM mutations inside the ProseMirror view to prevent decoration churn.
      if (this.editor) {
        this.editor.on('update', onUpdate);
      }

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false;
          triggerReflow();
          return true;
        },
        // This node is atomic and self-managed; ignore internal DOM mutations.
        ignoreMutation: () => true,
        destroy: () => {
          if (this.editor) {
            this.editor.off('update', onUpdate);
          }
        },
      };
    };
  },


});