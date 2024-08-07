/* global process */
export * from "./types";
export * from "./error";
export * from "./client";
export * from "./container";
export * from "./storage";
export * from "./utf8";
export * from "./base64";
export * from "./dpop";

/**
 * @public
 */
export const VERSION: string = process.env.VERSION ?? "VERSION";
