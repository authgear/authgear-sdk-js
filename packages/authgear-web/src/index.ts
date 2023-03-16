export * from "@authgear/core";
import { WebContainer } from "./container";
export * from "./container";
export * from "./types";
export * from "./experimental";
export * from "./latte";

/**
 * Default container.
 *
 * @remarks
 * This is a global shared container, provided for convenience.
 *
 * @public
 */
const defaultContainer: WebContainer = new WebContainer();

export default defaultContainer;
