import React from 'react';
import canUseDOM from '@lite/utils/dist/env/canUseDOM';

const useIsomorphicEffect = canUseDOM ? React.useLayoutEffect : React.useEffect;

export default useIsomorphicEffect;
