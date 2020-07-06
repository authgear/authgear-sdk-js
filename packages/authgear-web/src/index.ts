export * from "@authgear/core";
import { WebAPIClient } from "./client";
export * from "./client";
export * from "./storage";
import { WebContainer } from "./container";
export * from "./container";

/**
 * Default container.
 *
 * @remarks
 * This is a global shared container, provided for convenience.
 *
 * @public
 */
const defaultContainer: WebContainer<WebAPIClient> = new WebContainer();

export default defaultContainer;
