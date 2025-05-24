import { Extension } from "@tiptap/core";
interface PaginationPlusOptions {
    pageHeight: number;
    pageGap: number;
    pageBreakBackground: string;
    pageHeaderHeight: number;
    pageGapBorderSize: number;
    footerRight: string;
    footerLeft: string;
    headerRight: string;
    headerLeft: string;
}
export declare const PaginationPlus: Extension<PaginationPlusOptions, any>;
export {};
