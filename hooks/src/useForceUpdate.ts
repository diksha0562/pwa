import { useState, useCallback } from 'react';

/**
 * This hooks returns a `forceUpdate()` function
 * because currently we can't do `forceUpdate` in functional component
 */
const useForceUpdate = () => {
  const [, setToggle] = useState(true);

  const forceUpdate = useCallback(() => {
    setToggle(prevToggle => !prevToggle);
  }, []);

  return forceUpdate;
};

export default useForceUpdate;
