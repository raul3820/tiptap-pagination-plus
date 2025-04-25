// DecorativeDecoration.ts
import { Editor, Extension } from "@tiptap/core";
import { EditorState, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

interface PaginationPlusOptions {
  pageHeight: number;
  pageGap: number;
  pageBreakBackground: string;
  pageHeaderHeight: number;
  pageGapBorderSize: number;
}

export const PaginationPlus = Extension.create<PaginationPlusOptions>({
  name: "PaginationPlus",
   addOptions() {
    return {
      pageHeight: 800,
      pageGap: 50,
      pageGapBorderSize: 1,
      pageBreakBackground: "#ffffff",
      pageHeaderHeight: 10,
    }
  },
  onCreate() {
    this.editor.view.dispatch(
      this.editor.view.state.tr.setMeta("DECORATION_META_KEY", true)
    )
  },
 
  addProseMirrorPlugins() {
    const pageOptions = this.options;
    return [
      new Plugin({
        key: new PluginKey("pagination"),

        state: {
          init(_, state) {
            const widgetList = createDecoration(state, pageOptions);
            return DecorationSet.create(state.doc, widgetList);
          },
          apply(tr, oldDeco, oldState, newState) {
            // Recalculate only on doc changes
            
            if (tr.docChanged || tr.getMeta("DECORATION_META_KEY")) {
              
              const widgetList = createDecoration(newState, pageOptions);
              return DecorationSet.create(newState.doc, [
                ...widgetList,
              ]);
            }
            return oldDeco;
          },
        },

        props: {
          decorations(state: EditorState) {
            return this.getState(state) as DecorationSet
          },
          handlePaste: (view, event, slice) => {
            // Let the default paste handler run first
            const result = view.dispatch(view.state.tr.replaceSelection(slice));
            
            // After paste, trigger decoration update
            setTimeout(() => {
              view.dispatch(view.state.tr.setMeta("DECORATION_META_KEY", true));
            }, 0);
            
            return result;
          },
        },
      }),
    ];
  },
});
function createDecoration(state: EditorState, pageOptions: PaginationPlusOptions): Decoration[] {
  const pageWidget = Decoration.widget(
    0,
    (view) => {
      const _extraPages = 0;
      const _pageGap = pageOptions.pageGap;
      const _pageHeaderHeight = pageOptions.pageHeaderHeight;
      const _pageHeight = (pageOptions.pageHeight - (_pageHeaderHeight * 2));
      const _pageBreakBackground = pageOptions.pageBreakBackground;
      const _pageGapBorderSize = pageOptions.pageGapBorderSize;


      const childElements = view.dom.children;
      let totalHeight = 0;
      
      for (let i = 2; i < (childElements.length - 1); i++) {
        totalHeight += childElements[i].scrollHeight;
      }

      const paginationElement = document.querySelector("[data-pagination]");
      
      let previousPageCount = paginationElement ? paginationElement.children.length : 0;
      previousPageCount = previousPageCount > _extraPages ? previousPageCount - _extraPages : 0;
      
      const totalPageGap = _pageGap + _pageHeaderHeight + _pageHeaderHeight;
      
      let actualPageContentHeight = totalHeight - (previousPageCount * (totalPageGap + (_pageGapBorderSize * 2)));
      let pages = Math.ceil(actualPageContentHeight/_pageHeight);
      pages = pages > 0 ? pages - 1 : 0;
      const breakerWidth = view.dom.scrollWidth;
      
      const el = document.createElement("div");
      el.dataset.pagination = "true";

      const pageBreakDefinition = ({firstPage = false, lastPage = false}: {firstPage: boolean, lastPage: boolean}) => {
        const pageContainer = document.createElement("div");
        
        const page = document.createElement("div");
        page.classList.add("page");
        page.style.position = "relative";
        page.style.float = "left";
        page.style.clear = "both";
        page.style.marginTop = firstPage ? `calc(${_pageHeaderHeight}px + ${_pageHeight}px)` : _pageHeight + "px";

        const pageBreak = document.createElement("div");
        pageBreak.classList.add("breaker");
        pageBreak.style.width = `calc(${breakerWidth}px)`;
        pageBreak.style.marginLeft = `calc(calc(calc(${breakerWidth}px - 100%) / 2) - calc(${breakerWidth}px - 100%))`;
        pageBreak.style.marginRight = `calc(calc(calc(${breakerWidth}px - 100%) / 2) - calc(${breakerWidth}px - 100%))`;
        pageBreak.style.position = "relative";
        pageBreak.style.float = "left";
        pageBreak.style.clear = "both";
        pageBreak.style.left = "0px";
        pageBreak.style.right = "0px";
        pageBreak.style.zIndex = "2";
        
        const pageFooter = document.createElement("div");
        pageFooter.style.height = _pageHeaderHeight + "px";
        
        const pageSpace = document.createElement("div");
        pageSpace.classList.add("pagination-gap");
        pageSpace.style.height = _pageGap + "px";
        pageSpace.style.borderLeft = "1px solid";
        pageSpace.style.borderRight = "1px solid";
        pageSpace.style.position = "relative";
        pageSpace.style.setProperty("width", "calc(100% + 2px)", "important");
        pageSpace.style.left = "-1px";
        pageSpace.style.backgroundColor = _pageBreakBackground;
        pageSpace.style.borderLeftColor = _pageBreakBackground;
        pageSpace.style.borderRightColor = _pageBreakBackground;

        const pageHeader = document.createElement("div");
        pageHeader.style.height = _pageHeaderHeight + "px";

        pageBreak.append( pageFooter, pageSpace, pageHeader);
        pageContainer.append(page, pageBreak);


        return pageContainer;
      }

      const page = pageBreakDefinition({firstPage: false, lastPage: false});
      const firstPage = pageBreakDefinition({firstPage: true, lastPage: false});
      const fragment = document.createDocumentFragment()
      
      // fragment.appendChild(firstPage);
      for (let i = 0; i < (pages + _extraPages); i++) {
        if(i === 0){
          fragment.appendChild(firstPage.cloneNode(true));
        }else{
          fragment.appendChild(page.cloneNode(true));
        }
      }
      // fragment.appendChild(lastPage);
      el.append(fragment);
      el.id = "pages";

      const renderPages = pages + _extraPages;
      view.dom.style.minHeight = `${(renderPages * (_pageGap + (_pageGapBorderSize * 2))) + ((renderPages + 1) * (_pageHeight + (_pageGap + _pageHeaderHeight * 2)))}px`;

      return el;
    },
    { side: -1 }
  )
  const firstHeaderWidget = Decoration.widget(0, () => {
    const el = document.createElement('div');
    el.dataset.decorative = 'true';
    el.style.height = `${pageOptions.pageHeaderHeight}px`;
    return el;
  }, { side: -1 });

  const lastFooterWidget = Decoration.widget(state.doc.content.size, () => {
            const el = document.createElement('div');
            el.dataset.decorative = 'true';
            el.style.height = `${pageOptions.pageHeaderHeight}px`;
            return el;
          }, { side: 1 });
  return [pageWidget, firstHeaderWidget, lastFooterWidget]
}
