/* global window, Request */

import { _BaseAPIClient } from "@authgear/core";

/**
 * @internal
 */
export class _WebAPIClient extends _BaseAPIClient {
  // Fetch function expect the context is window, if it doesn't we will get the
  // following error
  // TypeError: Failed to execute 'fetch' on 'Window': Illegal invocation
  // To prevent this, we bind window to the fetch function
  _fetchFunction = window.fetch.bind(window);
  _requestClass = Request;

  constructor() {
    super(null);
  }
}
