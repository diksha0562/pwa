import { useRef, useEffect, useCallback } from 'react';
import isSafari from '@lite/utils/dist/env/isSafari';
import IdleQueue from '@lite/utils/dist/web/idleQueue';
import noop from '@lite/utils/dist/fp/noop';

type IdleQueueOptions = {
  minTaskTime?: number;
};

export interface QueueEntry {
  task?: () => void;
  delay?: number;
}

export type IdleQueueDispatch = (entry: QueueEntry) => void;

/**
 * @function useIdleQueue Custom hooks for using IdleQueue
 * @param {object} opts
 * @param {number} opts.minTaskTime
 */
const useIdleQueue = (opts: IdleQueueOptions = {}): [IdleQueueDispatch] => {
  const minTaskTime = opts.minTaskTime || 0;
  const idleQueueRef = useRef<IdleQueue>(new IdleQueue(minTaskTime));

  /**
   * @function enqueueTask
   * @param entry
   * @param entry.task
   * @param entry.delay
   * @returns {void}
   */
  const enqueueTask = useCallback((entry: QueueEntry = {}) => {
    const task = entry.task || noop;
    const delay = entry.delay || 0;

    idleQueueRef.current.enqueueTask(task, delay);
  }, []);

  /**
   * @function handleOnVisibilityChange
   * @returns {void}
   */
  const handleOnVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      idleQueueRef.current.cleanup();
    }
  }, []);

  /**
   * @function handleOnBeforeUnload
   * @returns {void}
   */
  const handleCleanUp = useCallback(() => {
    idleQueueRef.current.cleanup();
  }, []);

  /**
   * Effect to add `visibilitychange` listener.
   */
  useEffect(() => {
    window.addEventListener('visibilitychange', handleOnVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleOnVisibilityChange);
    };
  }, [handleOnVisibilityChange]);

  /**
   * Effect to add `beforeunload` listener.
   * Safari does not reliably fire the `pagehide` or `visibilitychange`
   * events when closing a tab, so we have to use `beforeunload` with a
   * timeout to check whether the default action was prevented.
   * - https://bugs.webkit.org/show_bug.cgi?id=151610
   * - https://bugs.webkit.org/show_bug.cgi?id=151234
   *
   * NOTE: we only add this to Safari because adding it to Firefox would
   * prevent the page from being eligible for bfcache.
   */
  useEffect(() => {
    if (!isSafari) return;

    window.addEventListener('beforeunload', handleCleanUp);

    return () => {
      window.removeEventListener('beforeunload', handleCleanUp);
    };
  }, [handleCleanUp]);

  /**
   * Effect for clean up on unmount/SPA Navigation
   */
  useEffect(() => {
    const ref = idleQueueRef.current;
    return () => {
      ref.cleanup();
    };
  }, []);

  return [enqueueTask];
};

export default useIdleQueue;
