import { useCallback, useEffect, useRef } from 'react';

/**
 * Use this hooks to check wether a component is mounted
 * (it's useful for asynchronous state updates)
 */
const useIsMounted = () => {
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => (isMounted.current = false);
  }, []);
  return useCallback(() => isMounted.current, []);
};

export default useIsMounted;
