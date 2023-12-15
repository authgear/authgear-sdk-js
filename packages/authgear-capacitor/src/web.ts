import { WebPlugin } from '@capacitor/core';

import type { AuthgearPlugin } from './definitions';

export class AuthgearWeb extends WebPlugin implements AuthgearPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
}
