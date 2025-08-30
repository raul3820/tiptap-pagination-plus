# TipTap Pagination Plus
[![NPM](https://img.shields.io/npm/v/tiptap-pagination-plus.svg)](https://www.npmjs.com/package/tiptap-pagination-plus)

`tiptap-pagination-plus` extension that adds pagination support to your editor with table handling capabilities.


# Demo
https://romikmakavana.me/tiptap-pagination/

## Documentation
https://romikmakavana.me/tiptap

## Installation

```bash
npm install tiptap-pagination-plus
```  

## Usage

### Basic Setup

```typescript
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { 
  PaginationPlus,
  TablePlus,
  TableRowPlus,
  TableCellPlus,
  TableHeaderPlus
} from 'tiptap-pagination-plus'

const editor = new Editor({
  extensions: [
    StarterKit,
    TablePlus,
    TableRowPlus,
    TableCellPlus,
    TableHeaderPlus,
    PaginationPlus.configure({
      pageHeight: 800,        // Height of each page in pixels
      pageGap: 50,            // Gap between pages in pixels
      pageGapBorderSize: 1,   // Border size for page gaps
      pageBreakBackground: "#ffffff",  // Background color for page gaps
      pageHeaderHeight: 50,   // Height of page header in pixels
      pageFooterHeight: 50,   // Height of page footer in pixels
      footerRight: "{page}",  // Custom text to display in the footer right side
      footerLeft: "",         // Custom text to display in the footer left side
      headerRight: "",        // Custom text to display in the header right side
      headerLeft: "",         // Custom text to display in the header left side
      marginTop: 0,           // Top margin for pages
      marginBottom: 0,        // Bottom margin for pages
      marginLeft: 50,         // Left margin for pages
      marginRight: 50,        // Right margin for pages
      contentMarginTop: 0,    // Top margin for content within pages
      contentMarginBottom: 0, // Bottom margin for content within pages
    }),
  ],
})
```

### Table Pagination

Key points for table pagination:
- Tables will automatically split across pages when they exceed the page height
- To split table across pages, you have to use these extensions
- List : TablePlus, TableRowPlus, TableCellPlus, TableHeaderPlus

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pageHeight` | number | 800 | Height of each page in pixels |
| `pageGap` | number | 50 | Gap between pages in pixels |
| `pageGapBorderSize` | number | 1 | Border size for page gaps |
| `pageBreakBackground` | string | "#ffffff" | Background color for page gaps |
| `pageHeaderHeight` | number | 50 | Height of page header in pixels |
| `pageFooterHeight` | number | 50 | Height of page footer in pixels |
| `footerRight` | string | "{page}" | Custom text to display in the footer right side |
| `footerLeft` | string | "" | Custom text to display in the footer left side |
| `headerRight` | string | "" | Custom text to display in the header right side |
| `headerLeft` | string | "" | Custom text to display in the header left side |
| `marginTop` | number | 0 | Top margin for pages |
| `marginBottom` | number | 0 | Bottom margin for pages |
| `marginLeft` | number | 50 | Left margin for pages |
| `marginRight` | number | 50 | Right margin for pages |
| `contentMarginTop` | number | 0 | Top margin for content within pages |
| `contentMarginBottom` | number | 0 | Bottom margin for content within pages |

### Features

- Automatic page breaks based on content height
- Page numbers in the footer
- Custom header/footer text support
- use `{page}` variable to display current page number in header/footer text
- Table pagination with header preservation
- Responsive design
- Automatic page height calculation
- Support for nested content

## License

MIT
