import { useCallback, useEffect } from "react";
import authgearWeb from "@authgear/web";
import { useIonRouter } from "@ionic/react";
import { readClientID, readEndpoint, readIsSSOEnabled } from "../storage";

export default function OAuthRedirect() {
  const router = useIonRouter();

  const finishAuthentication = useCallback(async () => {
    const clientID = readClientID();
    const endpoint = readEndpoint();
    const isSSOEnabled = readIsSSOEnabled();

    try {
      await authgearWeb.configure({
        clientID,
        endpoint,
        sessionType: "refresh_token",
        isSSOEnabled,
      });
      await authgearWeb.finishAuthentication();
      router.push("/", "root", "replace");
    } catch (e) {
      console.error(e);
    }
  }, [router]);

  useEffect(() => {
    finishAuthentication();
  }, [finishAuthentication]);

  return (
    <div>
      Finishing authentication. Open the inspector to see if there is any error.
    </div>
  );
}
