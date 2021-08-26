export * from "@authgear/core";
export * from "./client";
export * from "./storage";
import { WebContainer } from "./container";
export * from "./container";
export * from "./types";

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
