export function inspectMobileLayout() {
  const viewport = document.documentElement.clientWidth;
  return [...document.querySelectorAll('body *')].flatMap((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (!rect.width || !rect.height || style.visibility === 'hidden' ||
        element.closest('[aria-hidden="true"], [hidden], .ant-tabs-nav-list, .slick-list')) return [];
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      const css = getComputedStyle(parent);
      if (['auto', 'scroll'].includes(css.overflowX) && parent.scrollWidth > parent.clientWidth + 1) return [];
      parent = parent.parentElement;
    }
    let textClipped = false;
    if (element.childNodes.length === 1 && element.firstChild?.nodeType === Node.TEXT_NODE &&
        !element.closest('svg, .ant-select, .ant-select-dropdown') && style.textOverflow !== 'ellipsis' &&
        !['auto', 'scroll'].includes(style.overflowX)) {
      const range = document.createRange();
      range.selectNodeContents(element);
      const textRect = range.getBoundingClientRect();
      textClipped = textRect.right > viewport + 1 || textRect.left < -1;
    }
    if (rect.right <= viewport + 1 && rect.left >= -1 && !textClipped) return [];
    return [{ tag: element.tagName, class: element.className?.toString().slice(0, 180),
      text: element.textContent?.trim().slice(0, 90), left: Math.round(rect.left), right: Math.round(rect.right),
      overflow: style.overflowX, whiteSpace: style.whiteSpace }];
  }).slice(0, 25);
}
