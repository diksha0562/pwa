import { useRef, useEffect, useCallback } from 'react';

/**
 * This hook accept a callback function `onIntersect`
 * and returns a `targetRef`
 *
 * Usage:
 * const Component = () => {
 *   const targetRef = useImpression(() => console.log('impressed!'));
 *
 *   return <div ref={targetRef}>asdasdsad</div>
 * }
 */

const initialOptions = {
  root: null,
  rootMargin: '0px',
  threshold: [0.05, 0.3, 0.6, 0.95],
};

const useImpression = (onIntersect, optionsData = {}) => {
  const intersected = useRef(false);
  const targetRef = useRef();
  const observer = useRef(null);

  const options = { ...initialOptions, ...optionsData };

  if (process.env.NODE_ENV === 'development') {
    console.warn('useImpression is deprecated. Use useIntersect with onlyOnce set to `true` instead.');
  }

  const handleIntersect = useCallback(
    entries => {
      const isIntersecting = entries?.[0]?.isIntersecting || false;

      if (isIntersecting) {
        onIntersect();

        if (!intersected.current && observer.current) {
          observer.current.disconnect();
          observer.current = null;
          intersected.current = true;
        }
      }
    },
    [onIntersect, observer, intersected],
  );

  useEffect(() => {
    if (!intersected.current && !observer.current && targetRef.current) {
      observer.current = new IntersectionObserver(handleIntersect, options);
      observer.current.observe(targetRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
        observer.current = null;
      }
    };
  }, [handleIntersect, options]);

  return targetRef;
};

export default useImpression;
