import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import {
  deepEqualIterative,
  footerClickEvent,
  getCustomPages,
  getFooter,
  getFooterHeight,
  getHeader,
  getHeaderHeight,
  getHeight,
  headerClickEvent,
  updateCssVariables,
} from './utils';

const page_count_meta_key = 'PAGE_COUNT_META_KEY';
const defaultPageConfig = {
  enabled: true,
  pageBreakBackground: '#F9FBFD',
  pageHeight: 1123,
  pageWidth: 794,
  marginTop: 38,
  marginBottom: 38,
  marginLeft: 113,
  marginRight: 76,
  pageGap: 24,
  contentMarginTop: 57,
  contentMarginBottom: 57,
  footerRight: '',
  footerLeft: '',
  headerRight: '',
  headerLeft: '',
  customHeader: {} as Record<number, { headerLeft: string; headerRight: string }>,
  customFooter: {} as Record<number, { footerLeft: string; footerRight: string }>,
};

const defaultOptions = Object.assign(
  { pageGapBorderSize: 1, pageGapBorderColor: '#D1D5DB' },
  defaultPageConfig
);

const refreshPage = (targetNode: HTMLElement, paginationEnabled = true) => {
  const paginationElement = targetNode.querySelector('[data-rm-pagination]');
  if (paginationEnabled) {
    targetNode.removeAttribute('rm-pagination-disabled');
    if (paginationElement) {
      const pageCount = Math.max(1, paginationElement.children.length);
      const pageHeight = 1123;
      const pageGap = 24;
      const expectedMinHeight = pageCount * pageHeight + (pageCount - 1) * pageGap;
      targetNode.style.minHeight = `${expectedMinHeight}px`;
    }
  } else {
    targetNode.setAttribute('rm-pagination-disabled', '');
    targetNode.style.minHeight = 'auto';
  }
};

const getPageConfig = (_storage: any, _currentOptions: any) => {
  const pageConfig = {
    enabled: _storage.enabled ?? defaultOptions.enabled,
    pageBreakBackground: _storage.pageBreakBackground ?? defaultOptions.pageBreakBackground,
    pageHeight: _storage.pageHeight ?? defaultOptions.pageHeight,
    pageWidth: _storage.pageWidth ?? defaultPageConfig.pageWidth,
    marginTop: _storage.marginTop ?? defaultPageConfig.marginTop,
    marginBottom: _storage.marginBottom ?? defaultPageConfig.marginBottom,
    marginLeft: _storage.marginLeft ?? defaultPageConfig.marginLeft,
    marginRight: _storage.marginRight ?? defaultPageConfig.marginRight,
    pageGap: _storage.pageGap ?? defaultPageConfig.pageGap,
    contentMarginTop: _storage.contentMarginTop ?? defaultPageConfig.contentMarginTop,
    contentMarginBottom: _storage.contentMarginBottom ?? defaultPageConfig.contentMarginBottom,
    footerRight: _storage.footerRight ?? defaultPageConfig.footerRight,
    footerLeft: _storage.footerLeft ?? defaultPageConfig.footerLeft,
    headerRight: _storage.headerRight ?? defaultPageConfig.headerRight,
    headerLeft: _storage.headerLeft ?? defaultPageConfig.headerLeft,
    customHeader: _storage.customHeader ?? defaultPageConfig.customHeader,
    customFooter: _storage.customFooter ?? defaultPageConfig.customFooter,
  };
  return {
    config: pageConfig,
    options: Object.assign(Object.assign({}, _currentOptions), pageConfig),
  };
};

const getPageConfigFromOptions = (_currentOptions: any) => {
  return {
    enabled: _currentOptions.enabled ?? defaultOptions.enabled,
    pageBreakBackground: _currentOptions.pageBreakBackground ?? defaultOptions.pageBreakBackground,
    pageHeight: _currentOptions.pageHeight ?? defaultOptions.pageHeight,
    pageWidth: _currentOptions.pageWidth ?? defaultPageConfig.pageWidth,
    marginTop: _currentOptions.marginTop ?? defaultPageConfig.marginTop,
    marginBottom: _currentOptions.marginBottom ?? defaultPageConfig.marginBottom,
    marginLeft: _currentOptions.marginLeft ?? defaultPageConfig.marginLeft,
    marginRight: _currentOptions.marginRight ?? defaultPageConfig.marginRight,
    pageGap: _currentOptions.pageGap ?? defaultPageConfig.pageGap,
    contentMarginTop: _currentOptions.contentMarginTop ?? defaultPageConfig.contentMarginTop,
    contentMarginBottom: _currentOptions.contentMarginBottom ?? defaultPageConfig.contentMarginBottom,
    footerRight: _currentOptions.footerRight ?? defaultPageConfig.footerRight,
    footerLeft: _currentOptions.footerLeft ?? defaultPageConfig.footerLeft,
    headerRight: _currentOptions.headerRight ?? defaultPageConfig.headerRight,
    headerLeft: _currentOptions.headerLeft ?? defaultPageConfig.headerLeft,
    customHeader: _currentOptions.customHeader ?? defaultPageConfig.customHeader,
    customFooter: _currentOptions.customFooter ?? defaultPageConfig.customFooter,
  };
};

const paginationKey = new PluginKey('pagination');

export const PaginationPlus = Extension.create({
  name: 'PaginationPlus',

  addOptions() {
    return defaultOptions;
  },

  addStorage() {
    return Object.assign(Object.assign({}, defaultOptions), {
      headerHeight: new Map(),
      footerHeight: new Map(),
      appliedConfig: defaultPageConfig,
    });
  },

  onCreate() {
    const { options: _currentOptions } = getPageConfig(this.storage, this.options);
    const pageConfig = getPageConfigFromOptions(this.options);
    const targetNode = this.editor.view.dom;
    targetNode.classList.add('rm-with-pagination');
    targetNode.style.border = '1px solid var(--rm-page-gap-border-color)';
    targetNode.style.paddingLeft = 'var(--rm-margin-left)';
    targetNode.style.paddingRight = 'var(--rm-margin-right)';
    targetNode.style.width = 'var(--rm-page-width)';
    updateCssVariables(targetNode, Object.assign(Object.assign({}, _currentOptions), pageConfig));

    const style = document.createElement('style');
    style.dataset.rmPaginationStyle = '';
    style.textContent = `
      .rm-pagination-gap{
        border-top: 1px solid;
        border-bottom: 1px solid;
        border-color: var(--rm-page-gap-border-color);
      }
      .rm-with-pagination,
      .rm-with-pagination .rm-first-page-header {
        counter-reset: page-number page-number-plus 1;
      }
      .rm-with-pagination .image-plus-wrapper,
      .rm-with-pagination .table-plus td,
      .rm-with-pagination .table-plus th {
        max-height: var(--rm-max-content-child-height);
        overflow-y: auto;
      }
      .rm-with-pagination .image-plus-wrapper {
        overflow-y: visible;
      }
      .rm-with-pagination .rm-page-break {
        counter-increment: page-number page-number-plus;
      }
      .rm-with-pagination .rm-page-break:last-child .rm-pagination-gap {
        display: none;
      }
      .rm-with-pagination .rm-page-break:last-child .rm-page-header {
        display: none;
      }
      .rm-with-pagination table tr td,
      .rm-with-pagination table tr th {
        word-break: break-all;
      }
      .rm-with-pagination table > tr {
        display: grid;
        min-width: 100%;
      }
      .rm-with-pagination table {
        border-collapse: collapse;
        width: 100%;
        display: contents;
      }
      .rm-with-pagination table tbody{
        display: table;
        max-height: 300px;
        overflow-y: auto;
      }
      .rm-with-pagination table tbody > tr{
        display: table-row !important;
      }
      .rm-with-pagination *:has(>br.ProseMirror-trailingBreak:only-child) {
        display: table;
        width: 100%;
      }
      .rm-with-pagination .rm-br-decoration {
        display: table;
        width: 100%;
      }
      .rm-with-pagination .table-row-group {
        max-height: var(--rm-max-content-child-height);
        overflow-y: auto;
        width: 100%;
      }
      .rm-with-pagination .rm-page-footer-left,
      .rm-with-pagination .rm-page-footer-right,
      .rm-with-pagination .rm-page-header-left,
      .rm-with-pagination .rm-page-header-right {
        display: inline-block;
      }
      .rm-with-pagination .rm-page-header-left,
      .rm-with-pagination .rm-page-footer-left{
        float: left;
        margin-left: var(--rm-margin-left);
      }
      .rm-with-pagination .rm-page-header-right,
      .rm-with-pagination .rm-page-footer-right{
        float: right;
        margin-right: var(--rm-margin-right);
      }
      .rm-with-pagination .rm-first-page-header .rm-page-header-right{
        margin-right: 0px !important;
      }
      .rm-with-pagination .rm-first-page-header .rm-page-header-left{
        margin-left: 0px !important;
      }
      .rm-with-pagination .rm-page-number::before {
        content: counter(page-number);
      }
      .rm-with-pagination .rm-page-number-plus::before {
        content: counter(page-number-plus);
      }
      .rm-with-pagination .rm-page-header,
      .rm-with-pagination .rm-page-footer{
        width: 100%;
      }
      .rm-with-pagination .rm-page-header{
        padding-bottom: var(--rm-content-margin-top) !important;
        padding-top: var(--rm-margin-top) !important;
        display: inline-flex;
        justify-content: space-between;
        max-height: calc(calc(var(--rm-page-height) * 0.45) - var(--rm-margin-top) - var(--rm-content-margin-top));
        overflow-y: hidden;
      }
      .rm-with-pagination .rm-page-footer{
        padding-top: var(--rm-content-margin-bottom) !important;
        padding-bottom: var(--rm-margin-bottom) !important;
        display: inline-flex;
        justify-content: space-between;
        max-height: calc(calc(var(--rm-page-height) * 0.45) - var(--rm-content-margin-bottom) - var(--rm-margin-bottom));
        overflow-y: hidden;
      }
      .rm-with-pagination[rm-pagination-disabled] {
        padding-top: var(--rm-margin-top) !important;
        padding-bottom: var(--rm-margin-bottom) !important;
      }
    `;
    document.head.appendChild(style);
    refreshPage(targetNode, _currentOptions.enabled);
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const storage = this.storage as any;

    return [
      new Plugin({
        key: paginationKey,
        state: {
          init: (_, state) => {
            const _currentOptions = getPageConfigFromOptions(this.options);
            const pageConfig = getPageConfigFromOptions(this.options);
            const widgetList = createDecoration(
              Object.assign(Object.assign({}, this.options), _currentOptions),
              new Map(),
              new Map()
            );
            storage.pageBreakBackground = _currentOptions.pageBreakBackground;
            storage.pageHeight = _currentOptions.pageHeight;
            storage.pageWidth = _currentOptions.pageWidth;
            storage.marginTop = _currentOptions.marginTop;
            storage.marginBottom = _currentOptions.marginBottom;
            storage.marginLeft = _currentOptions.marginLeft;
            storage.marginRight = _currentOptions.marginRight;
            storage.pageGap = _currentOptions.pageGap;
            storage.contentMarginTop = _currentOptions.contentMarginTop;
            storage.contentMarginBottom = _currentOptions.contentMarginBottom;
            storage.footerRight = _currentOptions.footerRight;
            storage.footerLeft = _currentOptions.footerLeft;
            storage.headerRight = _currentOptions.headerRight;
            storage.headerLeft = _currentOptions.headerLeft;
            storage.customHeader = _currentOptions.customHeader;
            storage.customFooter = _currentOptions.customFooter;
            storage.headerHeight = new Map();
            storage.footerHeight = new Map();
            storage.appliedConfig = pageConfig;
            return {
              decorations: DecorationSet.create(state.doc, widgetList),
            };
          },
          apply: (_tr, oldDeco, _oldState, newState) => {
            const { options: _currentOptions, config: pageConfig } = getPageConfig(storage, this.options);
            if (
              storage.enabled === storage.appliedConfig.enabled &&
              storage.enabled === false &&
              storage.appliedConfig.enabled === false
            ) {
              return oldDeco;
            }
            const pageCount = getNewPageCount(editor.view, Object.assign(Object.assign({}, _currentOptions), pageConfig));
            const currentPageCount = getExistingPageCount(editor.view);
            const getNewDecoration = () => {
              const { options: _currOpts, config: pConfig } = getPageConfig(storage, this.options);
              updateCssVariables(editor.view.dom, _currOpts);
              const headerHeight = 'headerHeight' in storage ? storage.headerHeight : new Map();
              const footerHeight = 'footerHeight' in storage ? storage.footerHeight : new Map();
              const widgetList = createDecoration(
                Object.assign(Object.assign({}, _currOpts), pConfig),
                headerHeight,
                footerHeight
              );
              storage.appliedConfig = pConfig;
              storage.headerHeight = headerHeight;
              storage.footerHeight = footerHeight;
              return {
                decorations: DecorationSet.create(newState.doc, [...widgetList]),
                footerHeight,
              };
            };
            if (
              (pageCount > 1 ? pageCount : 1) !== currentPageCount ||
              storage.enabled !== storage.appliedConfig.enabled ||
              storage.pageBreakBackground !== storage.appliedConfig.pageBreakBackground ||
              storage.pageHeight !== storage.appliedConfig.pageHeight ||
              storage.pageWidth !== storage.appliedConfig.pageWidth ||
              storage.marginTop !== storage.appliedConfig.marginTop ||
              storage.marginBottom !== storage.appliedConfig.marginBottom ||
              storage.marginLeft !== storage.appliedConfig.marginLeft ||
              storage.marginRight !== storage.appliedConfig.marginRight ||
              storage.pageGap !== storage.appliedConfig.pageGap ||
              storage.contentMarginTop !== storage.appliedConfig.contentMarginTop ||
              storage.contentMarginBottom !== storage.appliedConfig.contentMarginBottom ||
              storage.headerLeft !== storage.appliedConfig.headerLeft ||
              storage.headerRight !== storage.appliedConfig.headerRight ||
              storage.footerLeft !== storage.appliedConfig.footerLeft ||
              storage.footerRight !== storage.appliedConfig.footerRight ||
              !deepEqualIterative(storage.appliedConfig.customHeader, storage.customHeader) ||
              !deepEqualIterative(storage.appliedConfig.customFooter, storage.customFooter)
            ) {
              return getNewDecoration();
            }
            return oldDeco;
          },
        },
        props: {
          decorations(state) {
            return (this.getState(state) as any)?.decorations;
          },
        },
        view: () => {
          return {
            update: (view) => {
              const { options: _currentOptions, config: pageConfig } = getPageConfig(storage, this.options);
              if (!pageConfig.enabled && !view.dom.hasAttribute('rm-pagination-disabled')) {
                refreshPage(view.dom, false);
                return;
              }
              const pageCount = getNewPageCount(view, Object.assign(Object.assign({}, _currentOptions), pageConfig));
              const currentPageCount = getExistingPageCount(view);
              const triggerUpdate = (_footerHeight?: any) => {
                requestAnimationFrame(() => {
                  const tr = view.state.tr.setMeta(page_count_meta_key, { footerHeight: _footerHeight });
                  view.dispatch(tr);
                });
              };
              if (currentPageCount !== pageCount) {
                triggerUpdate();
                return;
              }
              const headerHeight = getHeaderHeight(view.dom, getCustomPages(_currentOptions.customHeader, {}), 'content');
              const footerHeight = getFooterHeight(view.dom, getCustomPages({}, _currentOptions.customFooter), 'content');
              const footerHeightForCurrentPages = new Map();
              for (let i = 0; i <= pageCount; i++) {
                if (footerHeight.has(i)) {
                  footerHeightForCurrentPages.set(i, footerHeight.get(i) || 0);
                }
              }
              const headerHeightForCurrentPages = new Map();
              for (let i = 0; i <= pageCount; i++) {
                if (headerHeight.has(i)) {
                  headerHeightForCurrentPages.set(i, headerHeight.get(i) || 0);
                }
              }
              const pagesSetToCheck = new Set([1, ...footerHeightForCurrentPages.keys(), ...headerHeightForCurrentPages.keys()]);
              let missingPageNumber: number | undefined = undefined;
              for (let i = 1; i <= pageCount; i++) {
                if (!pagesSetToCheck.has(i)) {
                  missingPageNumber = i;
                  break;
                }
              }
              if (missingPageNumber) {
                pagesSetToCheck.add(missingPageNumber);
              }
              pagesSetToCheck.delete(0);
              const pageContentHeightVariable: Record<string, string> = {};
              let maxContentHeight: number | undefined = undefined;
              for (const page of pagesSetToCheck) {
                const hHeight = headerHeightForCurrentPages.has(page)
                  ? headerHeightForCurrentPages.get(page) || 0
                  : headerHeightForCurrentPages.get(0) || 0;
                const fHeight = footerHeightForCurrentPages.has(page)
                  ? footerHeightForCurrentPages.get(page) || 0
                  : footerHeightForCurrentPages.get(0) || 0;
                const { _pageHeaderHeight, _pageHeight } = getHeight(_currentOptions, hHeight, fHeight);
                const contentHeight = page === 1 ? _pageHeight + _pageHeaderHeight : _pageHeight;
                if (page === 1) {
                  pageContentHeightVariable['rm-page-content-first'] = `${contentHeight}px`;
                }
                if (page === missingPageNumber) {
                  pageContentHeightVariable['rm-page-content-general'] = `${contentHeight}px`;
                } else {
                  pageContentHeightVariable[`rm-page-content-${page}`] = `${contentHeight}px`;
                }
                if (maxContentHeight === undefined || contentHeight < maxContentHeight) {
                  maxContentHeight = contentHeight;
                }
              }
              if (maxContentHeight) {
                view.dom.style.setProperty('--rm-max-content-child-height', `${maxContentHeight - 10}px`);
              }
              Object.entries(pageContentHeightVariable).forEach(([key, value]) => {
                view.dom.style.setProperty(`--${key}`, value);
              });
              refreshPage(view.dom, _currentOptions.enabled);
            },
          };
        },
      }),
    ];
  },

  addCommands() {
    return {
      updatePageBreakBackground:
        (color: string) =>
        ({ editor }: { editor: any }) => {
          this.storage.pageBreakBackground = color;
          refreshPage(editor.view.dom, this.storage.enabled);
          return true;
        },
      updatePageSize:
        (size: any) =>
        ({ editor }: { editor: any }) => {
          this.storage.pageHeight = size.pageHeight;
          this.storage.pageWidth = size.pageWidth;
          this.storage.marginTop = size.marginTop;
          this.storage.marginBottom = size.marginBottom;
          this.storage.marginLeft = size.marginLeft;
          this.storage.marginRight = size.marginRight;
          refreshPage(editor.view.dom, this.storage.enabled);
          return true;
        },
      updatePageHeight:
        (height: number) =>
        ({ editor }: { editor: any }) => {
          this.storage.pageHeight = height;
          refreshPage(editor.view.dom, this.storage.enabled);
          return true;
        },
      updatePageWidth:
        (width: number) =>
        ({ editor }: { editor: any }) => {
          this.storage.pageWidth = width;
          refreshPage(editor.view.dom, this.storage.enabled);
          return true;
        },
      updatePageGap:
        (gap: number) =>
        ({ editor }: { editor: any }) => {
          this.storage.pageGap = gap;
          refreshPage(editor.view.dom, this.storage.enabled);
          return true;
        },
      updateMargins:
        (margins: any) =>
        ({ editor }: { editor: any }) => {
          this.storage.marginTop = margins.top;
          this.storage.marginBottom = margins.bottom;
          this.storage.marginLeft = margins.left;
          this.storage.marginRight = margins.right;
          refreshPage(editor.view.dom, this.storage.enabled);
          return true;
        },
      updateContentMargins:
        (margins: any) =>
        ({ editor }: { editor: any }) => {
          this.storage.contentMarginTop = margins.top;
          this.storage.contentMarginBottom = margins.bottom;
          refreshPage(editor.view.dom, this.storage.enabled);
          return true;
        },
      updateHeaderContent:
        (left: string, right: string, pageNumber?: number) =>
        () => {
          if (pageNumber) {
            this.storage.customHeader[pageNumber] = { headerLeft: left, headerRight: right };
          } else {
            this.storage.headerLeft = left;
            this.storage.headerRight = right;
          }
          return true;
        },
      updateFooterContent:
        (left: string, right: string, pageNumber?: number) =>
        () => {
          if (pageNumber) {
            this.storage.customFooter[pageNumber] = { footerLeft: left, footerRight: right };
          } else {
            this.storage.footerLeft = left;
            this.storage.footerRight = right;
          }
          return true;
        },
      togglePagination:
        () =>
        ({ editor }: { editor: any }) => {
          this.storage.enabled = !this.storage.enabled;
          refreshPage(editor.view.dom, this.storage.enabled);
          return true;
        },
      enablePagination:
        () =>
        ({ editor }: { editor: any }) => {
          this.storage.enabled = true;
          refreshPage(editor.view.dom, true);
          return true;
        },
      disablePagination:
        () =>
        ({ editor }: { editor: any }) => {
          this.storage.enabled = false;
          refreshPage(editor.view.dom, false);
          return true;
        },
    } as any;
  },
});

const getExistingPageCount = (view: any) => {
  const editorDom = view.dom;
  const paginationElement = editorDom.querySelector('[data-rm-pagination]');
  if (paginationElement) {
    return paginationElement.children.length;
  }
  return 0;
};

const calculatePageCount = (view: any, pageOptions: any, headerHeight = 0, footerHeight = 0) => {
  const editorDom = view.dom;
  const _pageHeaderHeight = pageOptions.contentMarginTop + pageOptions.marginTop + headerHeight;
  const _pageFooterHeight = pageOptions.contentMarginBottom + pageOptions.marginBottom + footerHeight;
  const pageContentAreaHeight = pageOptions.pageHeight - _pageHeaderHeight - _pageFooterHeight;
  const paginationElement = editorDom.querySelector('[data-rm-pagination]');
  const currentPageCount = getExistingPageCount(view);

  if (paginationElement) {
    const lastElementOfEditor = editorDom.lastElementChild;
    const lastPageBreak = paginationElement.lastElementChild?.querySelector('.breaker') as HTMLElement | null;

    if (lastElementOfEditor && lastPageBreak) {
      // Use editor-relative coordinates to avoid scroll offset issues.
      const editorRect = editorDom.getBoundingClientRect();
      const lastElementRect = lastElementOfEditor.getBoundingClientRect();
      const lastPageBreakRect = lastPageBreak.getBoundingClientRect();

      // Convert to editor-relative Y coordinates.
      const lastElementBottom = lastElementRect.bottom - editorRect.top;
      const lastPageBreakTop = lastPageBreakRect.top - editorRect.top;

      // THE CORE GOOGLE DOCS MECHANISM:
      // The printable area boundary of the last page is at lastPageBreakTop.
      // The instant any content's bottom exceeds this boundary, create a new page.
      // This prevents the page from visually stretching before a split is triggered.
      const overflow = lastElementBottom - lastPageBreakTop;

      if (overflow > 2) {
        const addPage = Math.ceil(overflow / pageContentAreaHeight);
        return currentPageCount + Math.max(1, addPage);
      } else {
        const allBreaks = Array.from(paginationElement.querySelectorAll('.breaker')) as HTMLElement[];
        const allBreaksAfterLastElement = allBreaks.filter(
          (element) => (element.getBoundingClientRect().top - editorRect.top) > lastElementBottom + 5
        );
        const removePage = allBreaksAfterLastElement.length;
        if (removePage > 1) {
          return Math.max(1, currentPageCount - (removePage - 1));
        } else {
          return currentPageCount;
        }
      }
    }
    return 1;
  } else {
    const editorHeight = editorDom.scrollHeight;
    let pageCount = Math.ceil(editorHeight / pageContentAreaHeight);
    pageCount = pageCount <= 0 ? 1 : pageCount;
    return pageCount;
  }
};


const getNewPageCount = (view: any, pageOptions: any) => {
  if (pageOptions.enabled) {
    const pageCount = calculatePageCount(view, pageOptions);
    return pageCount <= 1 ? 1 : pageCount;
  } else {
    return 0;
  }
};

function createDecoration(pageOptions: any, headerHeightMap: any, footerHeightMap: any) {
  if (!pageOptions.enabled) {
    return [];
  }
  const commonHeaderOptions = { headerLeft: pageOptions.headerLeft, headerRight: pageOptions.headerRight };
  const commonFooterOptions = { footerLeft: pageOptions.footerLeft, footerRight: pageOptions.footerRight };

  const pageWidget = Decoration.widget(
    0,
    (view) => {
      const _pageGap = pageOptions.pageGap;
      const _pageBreakBackground = pageOptions.pageBreakBackground;
      const el = document.createElement('div');
      el.dataset.rmPagination = 'true';

      const pageBreakDefinition = (
        firstPage: boolean,
        pageHeader: HTMLElement,
        pageFooter: HTMLElement,
        headerHeight: number,
        footerHeight: number,
        pageNumber?: number
      ) => {
        const { _pageHeaderHeight, _pageHeight } = getHeight(pageOptions, headerHeight, footerHeight);
        const pageContainer = document.createElement('div');
        pageContainer.classList.add('rm-page-break');

        const page = document.createElement('div');
        page.classList.add('page');
        page.style.position = 'relative';
        page.style.float = 'left';
        page.style.clear = 'both';

        const marginTop = firstPage
          ? `calc(${_pageHeaderHeight}px + ${_pageHeight}px)`
          : `${_pageHeight}px`;

        if (pageNumber) {
          page.style.marginTop = `var(--rm-page-content-${pageNumber}, ${marginTop})`;
        } else {
          page.style.marginTop = firstPage
            ? `var(--rm-page-content-first, ${marginTop})`
            : `var(--rm-page-content-general, ${marginTop})`;
        }

        const pageBreak = document.createElement('div');
        pageBreak.classList.add('breaker');
        pageBreak.style.width = 'calc(100% + var(--rm-margin-left) + var(--rm-margin-right))';
        pageBreak.style.marginLeft = 'calc(-1 * var(--rm-margin-left))';
        pageBreak.style.marginRight = 'calc(-1 * var(--rm-margin-right))';
        pageBreak.style.position = 'relative';
        pageBreak.style.float = 'left';
        pageBreak.style.clear = 'both';
        pageBreak.style.left = '0px';
        pageBreak.style.right = '0px';
        pageBreak.style.zIndex = '2';

        const pageSpace = document.createElement('div');
        pageSpace.classList.add('rm-pagination-gap');
        pageSpace.style.height = `${_pageGap}px`;
        pageSpace.style.borderLeft = '1px solid';
        pageSpace.style.borderRight = '1px solid';
        pageSpace.style.position = 'relative';
        pageSpace.style.setProperty('width', 'calc(100% + 2px)', 'important');
        pageSpace.style.left = '-1px';
        pageSpace.style.backgroundColor = _pageBreakBackground;
        pageSpace.style.borderLeftColor = _pageBreakBackground;
        pageSpace.style.borderRightColor = _pageBreakBackground;

        pageBreak.append(pageFooter, pageSpace, pageHeader);
        pageContainer.append(page, pageBreak);
        return pageContainer;
      };

      const _headerHeight = headerHeightMap.get(0) || 0;
      const _footerHeight = footerHeightMap.get(0) || 0;
      const fragment = document.createDocumentFragment();
      const pageCount = getNewPageCount(view, pageOptions);

      for (let i = 0; i < pageCount; i++) {
        const pageNumber = i + 1;
        const headerPageNumber = i + 2;
        if (
          headerPageNumber in pageOptions.customHeader ||
          pageNumber in pageOptions.customFooter ||
          pageNumber in pageOptions.customHeader
        ) {
          let _headerOptions = commonHeaderOptions;
          let _footerOptions = commonFooterOptions;
          let _pageHeaderHeight = _headerHeight;
          let _pageFooterHeight = _footerHeight;
          if (headerPageNumber in pageOptions.customHeader) {
            _headerOptions = pageOptions.customHeader[headerPageNumber] || commonHeaderOptions;
            _pageHeaderHeight = headerHeightMap.get(headerPageNumber) || 0;
          }
          if (pageNumber in pageOptions.customFooter) {
            _footerOptions = pageOptions.customFooter[pageNumber] || commonFooterOptions;
            _pageFooterHeight = footerHeightMap.get(pageNumber) || 0;
          }
          const _pageHeader = getHeader(
            _headerOptions.headerRight,
            _headerOptions.headerLeft,
            headerClickEvent(headerPageNumber, pageOptions.onHeaderClick),
            headerPageNumber
          );
          const _pageFooter = getFooter(
            _footerOptions.footerRight,
            _footerOptions.footerLeft,
            footerClickEvent(pageNumber, pageOptions.onFooterClick),
            pageNumber
          );
          const pageBreak = pageBreakDefinition(
            i === 0,
            _pageHeader,
            _pageFooter,
            _pageHeaderHeight,
            _pageFooterHeight,
            pageNumber
          );
          fragment.appendChild(pageBreak);
        } else {
          const __pageHeader = getHeader(
            commonHeaderOptions.headerRight,
            commonHeaderOptions.headerLeft,
            headerClickEvent(headerPageNumber, pageOptions.onHeaderClick)
          );
          const __pageFooter = getFooter(
            commonFooterOptions.footerRight,
            commonFooterOptions.footerLeft,
            footerClickEvent(pageNumber, pageOptions.onFooterClick)
          );
          fragment.appendChild(pageBreakDefinition(i === 0, __pageHeader, __pageFooter, _headerHeight, _footerHeight));
        }
      }

      el.append(fragment);
      el.id = 'pages';
      el.classList.add('rm-pages-wrapper');
      return el;
    },
    { side: -1 }
  );

  const firstHeaderWidget = Decoration.widget(
    0,
    () => {
      const pageNumber = 1;
      let _headerOptions = commonHeaderOptions;
      if (pageNumber in pageOptions.customHeader) {
        _headerOptions = pageOptions.customHeader[pageNumber];
      }
      const el = getHeader(
        _headerOptions.headerRight,
        _headerOptions.headerLeft,
        headerClickEvent(pageNumber, pageOptions.onHeaderClick)
      );
      el.classList.add('rm-first-page-header');
      return el;
    },
    { side: -1 }
  );

  return [pageWidget, firstHeaderWidget];
}
