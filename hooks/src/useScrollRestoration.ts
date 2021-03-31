import { useContext, useRef, useCallback, useEffect, useMemo, Context } from 'react';
import canUseDom from '@lite/utils/dist/env/canUseDOM';
import useIsomorphicEffect from './useIsomorphicEffect';

type Action = 'PUSH' | 'POP' | 'REPLACE';
type UnregisterCallback = () => void;

interface ContextInterface {
  read(location: object, identifier: string): number;
  write(location: object, identifier: string, value: number): void;
}

export interface LocationInterface<T = {}> {
  pathname?: string;
  search?: string;
  hash?: string;
  state?: T;
  key?: string;
}

interface OptionsInterface {
  identifier: string;
  location: LocationInterface;
  history: {
    listen(callback: (location: LocationInterface, action: Action) => void): UnregisterCallback;
  };
}

/**
 * Custom hooks to provide restoring a user's scroll position when navigating previous page.
 * It requires @lite/components/ScrollRestoration to read scroll postion stored in sessionStorage.
 * If you are interested for using this component, please refer to WPE confluence.
 */
const useScrollRestoration = (
  ScrollContext: Context<ContextInterface>,
  { identifier, history, location }: OptionsInterface,
) => {
  const scroll = useContext(ScrollContext);
  const elementRef = useRef<HTMLElement>(null);
  const timeoutId = useRef(0);
  const rafId = useRef(0);

  const cancelRaf = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = 0;
    }
  }, []);

  const cancelTimeout = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = 0;
    }
  }, []);

  const scrollTo = useCallback(
    (position, element = null) => {
      rafId.current = requestAnimationFrame(() => {
        // Put the window.scrollTo to the macrotask queue to prevent
        // race condition with browser's scroll restoration. So the callback
        // will be invoked once the call stack on the main thread is empty or after
        // restoration event (if any) gets called.
        timeoutId.current = window.setTimeout(() => {
          (element || window).scrollTo(0, position);
          cancelTimeout();
        }, 0);
      });
    },
    [cancelTimeout],
  );

  const handleHistoryChange = useCallback(
    (loc: LocationInterface, action: Action) => {
      if (canUseDom && !elementRef.current && scroll) {
        if (action === 'POP') {
          const { key } = loc;
          const position = scroll.read(loc, key || '');

          if (position) {
            scrollTo(position);
          }
        }
      }
    },
    [scroll, scrollTo],
  );

  const unlisten = useMemo(() => history.listen(handleHistoryChange), [history, handleHistoryChange]);

  useEffect(() => {
    return () => {
      if (typeof unlisten === 'function') {
        unlisten();
      }

      cancelRaf();
      cancelTimeout();
    };
  }, [cancelRaf, cancelTimeout, unlisten]);

  useIsomorphicEffect(() => {
    if (canUseDom && elementRef.current && scroll) {
      const elPosition = scroll.read(location, identifier);

      if (elPosition) {
        scrollTo(elPosition, elementRef.current);
      }
    }
  }, [identifier, location, scroll, scrollTo]);

  return {
    ref: elementRef,
    onScroll() {
      if (canUseDom && elementRef.current && scroll) {
        scroll.write(location, identifier, elementRef.current.scrollTop);
      }
    },
  };
};

export default useScrollRestoration;
