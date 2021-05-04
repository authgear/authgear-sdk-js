import { SessionStateChangeReason } from "@authgear/core";
import { WebContainer } from ".";

/**
 * @public
 */
export interface WebContainerDelegate {
  /**
   * This callback will be called when the session state is changed.
   *
   * For example, when the user logs out, the new state is "NO_SESSION"
   * and the reason is "LOGOUT".
   *
   * @public
   */
  onSessionStateChange: (
    container: WebContainer,
    reason: SessionStateChangeReason
  ) => void;
}
