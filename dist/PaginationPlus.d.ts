import { Extension } from "@tiptap/core";
export interface PaginationPlusOptions {
    pageHeight: number;
    pageGap: number;
    pageBreakBackground: string;
    pageHeaderHeight: number;
    pageFooterHeight: number;
    pageGapBorderSize: number;
    footerRight: string;
    footerLeft: string;
    headerRight: string;
    headerLeft: string;
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    contentMarginTop: number;
    contentMarginBottom: number;
}
export declare const PaginationPlus: Extension<PaginationPlusOptions, any>;
