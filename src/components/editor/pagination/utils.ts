import type {
  HeaderHeightMap,
  FooterHeightMap,
} from './types';

export const updateCssVariables = (targetNode: HTMLElement, config: any) => {
  const cssVariables: Record<string, string> = {
    'rm-page-height': `${config.pageHeight}px`,
    'rm-margin-top': `${config.marginTop}px`,
    'rm-margin-bottom': `${config.marginBottom}px`,
    'rm-margin-left': `${config.marginLeft}px`,
    'rm-margin-right': `${config.marginRight}px`,
    'rm-content-margin-top': `${config.contentMarginTop}px`,
    'rm-content-margin-bottom': `${config.contentMarginBottom}px`,
    'rm-page-gap-border-color': `${config.pageGapBorderColor}`,
    'rm-page-width': `${config.pageWidth}px`,
  };
  Object.entries(cssVariables).forEach(([key, value]) => {
    targetNode.style.setProperty(`--${key}`, value);
  });
};

export const getPageSize = (
  height: number,
  width: number,
  marginTop: number,
  marginBottom: number,
  marginLeft: number,
  marginRight: number
) => {
  return {
    pageHeight: height,
    pageWidth: width,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
  };
};

export const getHeaderHeightSelector = (pageNumber: number, type: string) => {
  return type === 'actual'
    ? `.rm-page-header-${pageNumber}`
    : `.rm-page-header-${pageNumber} .rm-page-header-content`;
};

export const getHeaderHeight = (
  targetNode: HTMLElement,
  pageNumbers: number[],
  type: string
): HeaderHeightMap => {
  const headerHeightMap: HeaderHeightMap = new Map();
  const clientHeader = targetNode.querySelector(getHeaderHeightSelector(0, type)) as HTMLElement | null;
  headerHeightMap.set(0, clientHeader ? clientHeader.clientHeight : 0);
  pageNumbers.forEach((pageNumber) => {
    const header = targetNode.querySelector(getHeaderHeightSelector(pageNumber, type)) as HTMLElement | null;
    headerHeightMap.set(pageNumber, header ? header.clientHeight : 0);
  });
  return headerHeightMap;
};

export const getFooterHeightSelector = (pageNumber: number, type: string) => {
  return type === 'actual'
    ? `.rm-page-footer-${pageNumber}`
    : `.rm-page-footer-${pageNumber} .rm-page-footer-content`;
};

export const getFooterHeight = (
  targetNode: HTMLElement,
  pageNumbers: number[],
  type: string
): FooterHeightMap => {
  const footerHeightMap: FooterHeightMap = new Map();
  const clientFooter = targetNode.querySelector(getFooterHeightSelector(0, type)) as HTMLElement | null;
  footerHeightMap.set(0, clientFooter ? clientFooter.clientHeight : 0);
  pageNumbers.forEach((pageNumber) => {
    const footer = targetNode.querySelector(getFooterHeightSelector(pageNumber, type)) as HTMLElement | null;
    footerHeightMap.set(pageNumber, footer ? footer.clientHeight : 0);
  });
  return footerHeightMap;
};

export function deepEqualIterative(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a == null || b == null) {
    return false;
  }
  const stack = [{ x: a, y: b }];
  while (stack.length) {
    const item = stack.pop();
    if (!item) continue;
    const { x, y } = item;
    if (x === y) continue;
    if (typeof x !== typeof y || typeof x !== 'object' || x == null || y == null) {
      return false;
    }
    const xKeys = Object.keys(x);
    const yKeys = Object.keys(y);
    if (xKeys.length !== yKeys.length) return false;
    for (const key of xKeys) {
      if (!(key in y)) return false;
      const xVal = x[key];
      const yVal = y[key];
      if (xVal === yVal) continue;
      if (typeof xVal === 'object' && typeof yVal === 'object') {
        stack.push({ x: xVal, y: yVal });
      } else if (xVal !== yVal) {
        return false;
      }
    }
  }
  return true;
}

export function mapNumberEqual(a: Map<any, any>, b: Map<any, any>): boolean {
  if (!(a instanceof Map) || !(b instanceof Map) || a.size !== b.size) {
    return false;
  }
  for (const [k, v] of a) {
    if (b.get(k) !== v) return false;
  }
  return true;
}

export function getCustomPages(customHeader: any, customFooter: any): number[] {
  return [...Object.keys(customHeader || {}), ...Object.keys(customFooter || {})].map(Number);
}

export function getFooter(
  footerRightContent: string,
  footerLeftContent: string,
  onFooterClick?: (e: MouseEvent) => void,
  pageNumber?: number
): HTMLElement {
  const pageFooter = document.createElement('div');
  pageFooter.classList.add('rm-page-footer');
  pageFooter.classList.add(`rm-page-footer-${pageNumber || 0}`);
  pageFooter.style.overflow = 'visible';
  pageFooter.style.position = 'relative';
  pageFooter.style.cursor = 'pointer';

  const pageFooterContent = document.createElement('div');
  pageFooterContent.classList.add('rm-page-footer-content');
  pageFooterContent.style.width = '100%';
  pageFooterContent.style.overflow = 'hidden';

  const footerRight = (footerRightContent || '').replace('{page}', `<span class="rm-page-number"></span>`);
  const footerLeft = (footerLeftContent || '').replace('{page}', `<span class="rm-page-number"></span>`);

  const pageFooterLeft = document.createElement('div');
  pageFooterLeft.classList.add('rm-page-footer-left');
  pageFooterLeft.innerHTML = footerLeft;

  const pageFooterRight = document.createElement('div');
  pageFooterRight.classList.add('rm-page-footer-right');
  pageFooterRight.innerHTML = footerRight;

  pageFooterContent.append(pageFooterLeft, pageFooterRight);
  pageFooter.append(pageFooterContent);
  if (onFooterClick) {
    pageFooter.addEventListener('click', onFooterClick);
  }
  return pageFooter;
}

export function getHeader(
  headerRightContent: string,
  headerLeftContent: string,
  onHeaderClick?: (e: MouseEvent) => void,
  pageNumber?: number
): HTMLElement {
  const pageHeader = document.createElement('div');
  pageHeader.classList.add('rm-page-header');
  pageHeader.classList.add(`rm-page-header-${pageNumber || 0}`);
  pageHeader.style.overflow = 'hidden';
  pageHeader.style.cursor = 'pointer';
  pageHeader.style.position = 'relative';

  const pageHeaderContent = document.createElement('div');
  pageHeaderContent.classList.add('rm-page-header-content');
  pageHeaderContent.style.width = '100%';
  pageHeaderContent.style.overflow = 'hidden';

  const headerLeft = (headerLeftContent || '').replace('{page}', `<span class="rm-page-number-plus"></span>`);
  const headerRight = (headerRightContent || '').replace('{page}', `<span class="rm-page-number-plus"></span>`);

  const pageHeaderLeft = document.createElement('div');
  pageHeaderLeft.classList.add('rm-page-header-left');
  pageHeaderLeft.innerHTML = headerLeft;

  const pageHeaderRight = document.createElement('div');
  pageHeaderRight.classList.add('rm-page-header-right');
  pageHeaderRight.innerHTML = headerRight;

  pageHeaderContent.append(pageHeaderLeft, pageHeaderRight);
  pageHeader.append(pageHeaderContent);
  if (onHeaderClick) {
    pageHeader.addEventListener('click', onHeaderClick);
  }
  return pageHeader;
}

export const getHeight = (
  pageOptions: any,
  _headerHeight: number,
  _footerHeight: number
) => {
  const _pageHeaderHeight = pageOptions.contentMarginTop + pageOptions.marginTop + _headerHeight;
  const _pageFooterHeight = pageOptions.contentMarginBottom + pageOptions.marginBottom + _footerHeight;
  const _pageHeight = pageOptions.pageHeight - _pageHeaderHeight - _pageFooterHeight;
  return {
    _pageHeaderHeight,
    _pageFooterHeight,
    _pageHeight,
  };
};

export const headerClickEvent = (
  pageNumber: number,
  onHeaderClick?: (params: { event: MouseEvent; pageNumber: number }) => void
) => {
  return (event: MouseEvent) => {
    onHeaderClick?.({ event, pageNumber });
  };
};

export const footerClickEvent = (
  pageNumber: number,
  onFooterClick?: (params: { event: MouseEvent; pageNumber: number }) => void
) => {
  return (event: MouseEvent) => {
    onFooterClick?.({ event, pageNumber });
  };
};
