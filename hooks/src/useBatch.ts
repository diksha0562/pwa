import { useRef, useCallback, useEffect } from 'react';

export interface BatchOptionsInterface {
  timeout?: number;
  threshold?: number;
  batchKey?: string | number;
  onHitCallback?: (data: any) => any;
  onBatchCallback?: (data: any[]) => void;
}

export interface BatchHookInterface {
  addQueue: (data: any) => void;
  getQueue: () => any[];
  getBatch: () => Map<string | number, any>;
}

/**
 * @description Custom react hooks for batch inspired by apollo-link-batch.
 * @param {number} options.timeout - The timeout at which to batch, in milliseconds. Defaults to 10.
 * @param {number} options.threshold - The maximum number of item to include in one batch. Defaults to 1.
 * @param {(string|number)} options.batchKey - The name of property for the batch to use from the payload.
 * @param {Function} options.onHitCallback - Callback function to modify item before queued.
 * @param {Function} options.onBatchCallback - Callback function that will be called when queue has fulfil the batch.
 * @returns {Object}
 *
 * Usage:
 * const { addQueue } = useBatch({
 *   timeout: 1500,
 *   threshold: 5,
 *   batchKey: 'some-key',
 *   onHitCallback: (data) => {},
 *   onBatchCallback: (data) => {},
 * });
 *
 */
const useBatch = (options: BatchOptionsInterface): BatchHookInterface => {
  const { timeout, threshold, batchKey, onHitCallback, onBatchCallback } = options;
  const batchRef = useRef<Map<string | number, any>>(new Map());
  const queueRef = useRef<Set<any>>(new Set());
  const timeoutRef = useRef<any>(null);

  const TIMEOUT = timeout || 10;
  const THRESHOLD = threshold || 1;
  const BATCH_KEY = batchKey || '';

  /**
   * @function getQueue - Get the current queue.
   * @returns {Array<object>}
   */
  const getQueue = useCallback((): any[] => {
    return Array.from(queueRef.current);
  }, []);

  /**
   * @function getBatch - Get all batched items.
   * @returns {Map<string | number, object>}
   */
  const getBatch = useCallback((): Map<string | number, any> => {
    return new Map(batchRef.current);
  }, []);

  /**
   * @function _enqueueBatch - Enqueue the item. This function will:
   * - Add the item to the batch Map to prevent duplication.
   * - Add the item to the queue Set for future consumption.
   * @returns {void}
   */
  const _enqueueBatch = useCallback((key: string | number, item: any): void => {
    batchRef.current.set(key, item);
    queueRef.current.add(item);
    return;
  }, []);

  /**
   * @function _consumeQueue - Consume the current queue.
   * This will clear out the scheduler (if it called before the `TIMEOUT`) & empty the current queue for the next batch.
   * And called the `onBatchCallback` if provided & the queue is not empty.
   * @returns {void}
   */
  const _consumeQueue = useCallback((): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (queueRef.current.size !== 0 && typeof onBatchCallback === 'function') {
      onBatchCallback(Array.from(queueRef.current));
    }

    queueRef.current.clear();
    return;
  }, [onBatchCallback]);

  /**
   * @function _scheduleQueueConsumption - Set a scheduler based on the `TIMEOUT` provided to consume the queue.
   * @returns {void}
   */
  const _scheduleQueueConsumption = useCallback((): void => {
    const _timeout = setTimeout(() => {
      if (queueRef.current.size !== 0) {
        _consumeQueue();
      }
    }, TIMEOUT);

    timeoutRef.current = _timeout;
    return;
  }, [TIMEOUT, _consumeQueue]);

  /**
   * @function _cleanupQueue - Clean up queues on unmount or unload events
   * @returns {void}
   */
  const _cleanupQueue = useCallback((): void => {
    _consumeQueue();
    batchRef.current.clear();
    queueRef.current.clear();
  }, [_consumeQueue]);

  /**
   * @function addQueue - Callback function to add item to the queue.
   * @param {any} data Payload of the batch in object. The specified keyed property must be present on the payload.
   * @returns {void}
   */
  const addQueue = useCallback(
    (data: any): void => {
      const key = data[BATCH_KEY] || Date.now();

      if (batchRef.current.has(key)) {
        return;
      }

      /**
       * Before an item is added to the queue, `onHitCallback` is called to modify the payload data.
       * If not specified, the raw data will be added regardlessly.
       */
      let payload = data;
      if (typeof onHitCallback === 'function') {
        payload = onHitCallback(data);
      }
      _enqueueBatch(key, payload);

      /**
       * The first enqueued item triggers the queue scheduler.
       */
      if (!timeoutRef.current) {
        _scheduleQueueConsumption();
      }

      /**
       * When amount of queue item reaches the set `THRESHOLD`, trigger the queue consumption without waiting for the scheduler.
       */
      if (queueRef.current.size >= THRESHOLD) {
        _consumeQueue();
      }

      return;
    },
    [BATCH_KEY, THRESHOLD, onHitCallback, _enqueueBatch, _scheduleQueueConsumption, _consumeQueue],
  );

  /**
   * Effect to clean up and consume queue. Should clean up & consume on:
   * - SPA Navigation via React Router
   * - Reload page
   * - Close tab/browser
   * - Exit current site
   */
  useEffect(() => {
    const handleBeforeunload = () => {
      _cleanupQueue();
    };

    window.addEventListener('beforeunload', handleBeforeunload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeunload);
      _cleanupQueue();
    };
  }, [_cleanupQueue]);

  return { addQueue, getQueue, getBatch };
};

export default useBatch;
