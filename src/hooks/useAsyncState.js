import { useCallback, useState } from 'react';

import useIsMounted from './useIsMounted';


/**
 * Use this hook instead of useState when the state might be updated by
 * an async task, such as an AJAX request, a timeout or an interval
 */
const useAsyncState = (initialState) => {
  const isMounted = useIsMounted();
  const [value, setRawValue] = useState(initialState);
  const setValue = useCallback(
    newValue => {
      if (isMounted()) {
        setRawValue(newValue);
      }
    },
    [isMounted]
  );
  return [value, setValue];
}

export default useAsyncState;
