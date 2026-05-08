'use client';

import * as React from 'react';

/**
 * SSR-safe media-query hook.
 *
 * On the server (and during the first client render before hydration finishes),
 * returns the optional `defaultValue` so the markup is stable. After mount, it
 * subscribes to the live query and returns the real value.
 *
 * Used by the `Modal` primitive to switch between Dialog (desktop) and Sheet
 * (mobile, via vaul) at the 640px breakpoint.
 *
 * @example
 *   const isDesktop = useMediaQuery('(min-width: 640px)', false);
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = React.useState(defaultValue);

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
