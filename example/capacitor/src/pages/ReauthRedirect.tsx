import { useCallback, useEffect } from "react";
import authgearWeb from "@authgear/web";
import { useIonRouter } from "@ionic/react";
import { readClientID, readEndpoint, readIsSSOEnabled } from "../storage";

export default function ReauthRedirect() {
  const router = useIonRouter();

  const finishReauthentication = useCallback(async () => {
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
      await authgearWeb.finishReauthentication();
      router.push("/", "root", "replace");
    } catch (e) {
      console.error(e);
    }
  }, [router]);

  useEffect(() => {
    finishReauthentication();
  }, [finishReauthentication]);

  return (
    <div>
      Finishing reauthentication. Open the inspector to see if there is any
      error.
    </div>
  );
}
