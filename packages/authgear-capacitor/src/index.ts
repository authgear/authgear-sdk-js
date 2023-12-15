import { registerPlugin } from '@capacitor/core';

import type { AuthgearPlugin } from './definitions';

const Authgear = registerPlugin<AuthgearPlugin>('Authgear', {
  web: () => import('./web').then(m => new m.AuthgearWeb()),
});

export * from './definitions';
export { Authgear };
