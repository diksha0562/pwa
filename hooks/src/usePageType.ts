import { canUseDOM } from '@lite/utils/dist/env';
import { useEffect } from 'react';

/**
 *
 * @param {String} pageType:
 * send page_type that needed for pageview custom dimension and akamai dashboard
 *
 */

declare global {
  interface Window {
    dataLayer: {
      push: (options: any) => void;
    };
    newrelic: {
      setCurrentRouteName: (name: string) => void;
      setPageViewName: (name: string, host: string) => void;
      setCustomAttribute: (name: string, value: string) => void;
    };
    __PAGE_TYPE__: string;
  }
}

const noop = (): void => {
  // do nothing
};

let timeout: any = null;

const usePageType = ({ pageType = '', path = '', pathRoute = '', sendGlobalPageType = true, setPageView = noop }) => {
  useEffect(() => {
    if (canUseDOM && pathRoute && pageType) {
      // Add fallback to pathRoute for all Routes that doesn't delare the pageType
      // There is an edge case when Route doesnt pass any `path` prop, we will fallback to location.pathname instead
      const normalizePageType = pageType ? pageType.slice(1) : pathRoute || path;
      window.__PAGE_TYPE__ = normalizePageType;
      window.dataLayer && window.dataLayer.push({ page_type: pageType });

      // -- NEW RELIC PAGE GROUPING --start
      window.newrelic && window.newrelic.setPageViewName(normalizePageType, window.location.hostname);
      window.newrelic && window.newrelic.setCurrentRouteName(normalizePageType);
      window.newrelic && window.newrelic.setCustomAttribute('pageType', normalizePageType);
      // -- NEW RELIC PAGE GROUPING --end

      if (timeout) {
        clearTimeout(timeout);
      }

      // delay 300ms to avoid duplicate hit in nearly same timemillis
      timeout = setTimeout(() => {
        // @ts-ignore
        setPageView(normalizePageType);
      }, 300);
    }
  }, [pageType, sendGlobalPageType, path, pathRoute, setPageView]);
};

export default usePageType;
