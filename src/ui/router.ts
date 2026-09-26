import { useEffect, useState } from 'react';

export function useRoute(): [string, (r: string) => void] {
  const get = () => (window.location.hash.replace(/^#\/?/, '') || 'solver');
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const on = () => setRoute(get());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return [route, (r: string) => { window.location.hash = `#/${r}`; }];
}
