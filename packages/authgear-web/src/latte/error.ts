/**
 * @public
 */
export class LatteError extends Error {
  /**
   * @public
   */
  public details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.details = details;
  }
}
