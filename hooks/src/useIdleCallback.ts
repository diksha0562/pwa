import { useEffect } from 'react';

interface IdleRequestOptions {
  timeout: number;
}

type IdleCallbackHandle = number;

type IdleRequestCallback = () => void;

declare global {
  interface Window {
    requestIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): IdleCallbackHandle;
    cancelIdleCallback(handle: number): void;
  }
}

declare function requestIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): number;
declare function cancelIdleCallback(handle: number): void;

interface IdleCallbackInterface {
  fallbackInterval?: number;
  shouldSkip?: boolean;
  callback: IdleRequestCallback;
  options?: IdleRequestOptions;
}

const useIdleCallback = ({
  callback = () => {},
  options,
  fallbackInterval = 50,
  shouldSkip = false,
}: IdleCallbackInterface) => {
  useEffect(() => {
    if (shouldSkip) return;

    let timeout: ReturnType<typeof setTimeout>;

    const requestTimeout = () => {
      timeout = setTimeout(callback, fallbackInterval);
    };

    if (!window.requestIdleCallback) {
      requestTimeout();

      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }

    const idleCallback: IdleCallbackHandle = requestIdleCallback(callback, options);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }

      cancelIdleCallback(idleCallback);
    };
  }, [callback, fallbackInterval, options, shouldSkip]);
};

export default useIdleCallback;
