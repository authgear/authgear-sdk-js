import { useState, useCallback, useMemo, useEffect } from "react";
import type { MouseEvent } from "react";
import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonLabel,
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
} from "@ionic/react";
import type {
  IonInputCustomEvent,
  IonSelectCustomEvent,
  IonToggleCustomEvent,
  IonAlertCustomEvent,
  InputInputEventDetail,
  SelectChangeEventDetail,
  ToggleChangeEventDetail,
  OverlayEventDetail,
} from "@ionic/core";
import { Capacitor } from "@capacitor/core";
import authgearWeb, {
  SessionState,
  SessionStateChangeReason,
  CancelError as WebCancelError,
  WebContainer,
  UserInfo,
  Page as WebPage,
} from "@authgear/web";
import authgearCapacitor, {
  CapacitorContainer,
  TransientTokenStorage,
  PersistentTokenStorage,
  CancelError as CapacitorCancelError,
  ColorScheme,
  Page as CapacitorPage,
} from "@authgear/capacitor";
import {
  readClientID,
  readEndpoint,
  readIsSSOEnabled,
  writeClientID,
  writeEndpoint,
  writeIsSSOEnabled,
} from "../storage";

import "./Home.css";

const TITLE = "Authgear SDK";

const REDIRECT_URI_WEB_AUTHENTICATE = "http://localhost:8100/oauth-redirect";
const REDIRECT_URI_WEB_REAUTH = "http://localhost:8100/reauth-redirect";
const REDIRECT_URI_CAPACITOR = "com.authgear.exampleapp.capacitor://host/path";

function isPlatformWeb(): boolean {
  return Capacitor.getPlatform() === "web";
}

function AuthgearDemo() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertHeader, setAlertHeader] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientID, setClientID] = useState(() => {
    return readClientID();
  });
  const [endpoint, setEndpoint] = useState(() => {
    return readEndpoint();
  });
  const [page, setPage] = useState("");
  const [colorScheme, setColorScheme] = useState("");
  const [useTransientTokenStorage, setUseTransientTokenStorage] =
    useState(false);
  const [isSSOEnabled, setIsSSOEnabled] = useState(() => {
    return readIsSSOEnabled();
  });

  const [sessionState, setSessionState] = useState<SessionState | null>(() => {
    if (isPlatformWeb()) {
      return authgearWeb.sessionState;
    }
    return authgearCapacitor.sessionState;
  });

  const loggedIn = sessionState === "AUTHENTICATED";

  const delegate = useMemo(() => {
    const d = {
      onSessionStateChange: (
        container: WebContainer | CapacitorContainer,
        _reason: SessionStateChangeReason
      ) => {
        setSessionState(container.sessionState);
      },
    };
    return d;
  }, [setSessionState]);

  const showError = useCallback((e: any) => {
    const json = JSON.parse(JSON.stringify(e));
    json["constructor.name"] = e?.constructor?.name;
    json["message"] = e?.message;
    let message = JSON.stringify(json);

    if (e instanceof WebCancelError || e instanceof CapacitorCancelError) {
      // Cancel is not an error actually.
      return;
    }

    setIsAlertOpen(true);
    setAlertHeader("Error");
    setAlertMessage(message);
  }, []);

  const showUserInfo = useCallback((userInfo: UserInfo) => {
    const message = JSON.stringify(userInfo, null, 2);
    setIsAlertOpen(true);
    setAlertHeader("UserInfo");
    setAlertMessage(message);
  }, []);

  const postConfigure = useCallback(async () => {
    const sessionState = isPlatformWeb()
      ? authgearWeb.sessionState
      : authgearCapacitor.sessionState;
    if (sessionState !== "AUTHENTICATED") {
      setInitialized(true);
      return;
    }

    if (isPlatformWeb()) {
      await authgearWeb.fetchUserInfo();
    } else {
      await authgearCapacitor.fetchUserInfo();
    }

    setInitialized(true);
  }, []);

  const configure = useCallback(async () => {
    setLoading(true);
    try {
      writeClientID(clientID);
      writeEndpoint(endpoint);
      writeIsSSOEnabled(isSSOEnabled);

      if (isPlatformWeb()) {
        await authgearWeb.configure({
          clientID,
          endpoint,
          sessionType: "refresh_token",
          isSSOEnabled,
        });
      } else {
        await authgearCapacitor.configure({
          clientID,
          endpoint,
          tokenStorage: useTransientTokenStorage
            ? new TransientTokenStorage()
            : new PersistentTokenStorage(),
          isSSOEnabled,
        });
      }
      await postConfigure();
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [
    clientID,
    endpoint,
    isSSOEnabled,
    useTransientTokenStorage,
    postConfigure,
    showError,
  ]);

  const authenticate = useCallback(async () => {
    setLoading(true);

    try {
      if (isPlatformWeb()) {
        authgearWeb.startAuthentication({
          redirectURI: REDIRECT_URI_WEB_AUTHENTICATE,
          page: page === "" ? undefined : page,
        });
      } else {
        const result = await authgearCapacitor.authenticate({
          redirectURI: REDIRECT_URI_CAPACITOR,
          colorScheme:
            colorScheme === "" ? undefined : (colorScheme as ColorScheme),
          page: page === "" ? undefined : page,
        });
        showUserInfo(result.userInfo);
      }
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [colorScheme, page, showError, showUserInfo]);

  const showAuthTime = useCallback(() => {
    if (isPlatformWeb()) {
      const date = authgearWeb.getAuthTime();
      setIsAlertOpen(true);
      setAlertHeader("Auth Time");
      setAlertMessage(`${date}`);
    } else {
      const date = authgearCapacitor.getAuthTime();
      setIsAlertOpen(true);
      setAlertHeader("Auth Time");
      setAlertMessage(`${date}`);
    }
  }, []);

  const reauthenticate = useCallback(async () => {
    setLoading(true);
    try {
      if (isPlatformWeb()) {
        await authgearWeb.refreshIDToken();
        if (!authgearWeb.canReauthenticate()) {
          throw new Error(
            "canReauthenticate() returns false for the current user"
          );
        }

        authgearWeb.startReauthentication({
          redirectURI: REDIRECT_URI_WEB_REAUTH,
        });
      } else {
        await authgearCapacitor.refreshIDToken();
        if (!authgearCapacitor.canReauthenticate()) {
          throw new Error(
            "canReauthenticate() returns false for the current user"
          );
        }

        await authgearCapacitor.reauthenticate({
          redirectURI: REDIRECT_URI_CAPACITOR,
          colorScheme:
            colorScheme === "" ? undefined : (colorScheme as ColorScheme),
        });
        showAuthTime();
      }
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [showError, colorScheme, showAuthTime]);

  const openSettings = useCallback(async () => {
    if (isPlatformWeb()) {
      authgearWeb.open(WebPage.Settings);
    } else {
      authgearCapacitor.open(CapacitorPage.Settings);
    }
  }, []);

  const fetchUserInfo = useCallback(async () => {
    setLoading(true);
    try {
      if (isPlatformWeb()) {
        const userInfo = await authgearWeb.fetchUserInfo();
        showUserInfo(userInfo);
      } else {
        const userInfo = await authgearCapacitor.fetchUserInfo();
        showUserInfo(userInfo);
      }
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [showError, showUserInfo]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (isPlatformWeb()) {
        await authgearWeb.logout({
          redirectURI: window.location.origin + "/",
        });
      } else {
        await authgearCapacitor.logout();
      }
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (isPlatformWeb()) {
      authgearWeb.delegate = delegate;
    } else {
      authgearCapacitor.delegate = delegate;
    }

    return () => {
      if (isPlatformWeb()) {
        authgearWeb.delegate = undefined;
      } else {
        authgearCapacitor.delegate = undefined;
      }
    };
  }, [delegate]);

  // On web, it is more natural to configure automatically if client ID and endpoint are filled in.
  useEffect(() => {
    if (clientID !== "" && endpoint !== "") {
      configure();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAlertDismiss = useCallback(
    (_e: IonAlertCustomEvent<OverlayEventDetail>) => {
      setIsAlertOpen(false);
    },
    []
  );

  const onChangeClientID = useCallback(
    (e: IonInputCustomEvent<InputInputEventDetail>) => {
      if (e.detail.value != null) {
        setClientID(e.detail.value);
      }
    },
    []
  );

  const onChangeEndpoint = useCallback(
    (e: IonInputCustomEvent<InputInputEventDetail>) => {
      if (e.detail.value != null) {
        setEndpoint(e.detail.value);
      }
    },
    []
  );

  const onChangePage = useCallback(
    (e: IonSelectCustomEvent<SelectChangeEventDetail<string>>) => {
      setPage(e.detail.value);
    },
    []
  );

  const onChangeColorScheme = useCallback(
    (e: IonSelectCustomEvent<SelectChangeEventDetail<string>>) => {
      setColorScheme(e.detail.value);
    },
    []
  );

  const onChangeUseTransientTokenStorage = useCallback(
    (e: IonToggleCustomEvent<ToggleChangeEventDetail<unknown>>) => {
      setUseTransientTokenStorage(e.detail.checked);
    },
    []
  );

  const onChangeIsSSOEnabled = useCallback(
    (e: IonToggleCustomEvent<ToggleChangeEventDetail<unknown>>) => {
      setIsSSOEnabled(e.detail.checked);
    },
    []
  );

  const onClickConfigure = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      configure();
    },
    [configure]
  );

  const onClickAuthenticate = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      authenticate();
    },
    [authenticate]
  );

  const onClickReauthenticate = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      reauthenticate();
    },
    [reauthenticate]
  );

  const onClickOpenSettings = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      openSettings();
    },
    [openSettings]
  );

  const onClickFetchUserInfo = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      fetchUserInfo();
    },
    [fetchUserInfo]
  );

  const onClickShowAuthTime = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      showAuthTime();
    },
    [showAuthTime]
  );

  const onClickLogout = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      logout();
    },
    [logout]
  );

  return (
    <>
      <IonAlert
        isOpen={isAlertOpen}
        header={alertHeader}
        message={alertMessage}
        onIonAlertDidDismiss={onAlertDismiss}
      />
      <div className="container">
        <h1>
          Enter Client ID and Endpoint, and then click Configure to initialize
          the SDK
        </h1>
        <IonInput
          type="text"
          label="Client ID"
          placeholder="Enter Client ID"
          onIonInput={onChangeClientID}
          value={clientID}
        />
        <IonInput
          type="text"
          label="Endpoint"
          placeholder="Enter Authgear endpoint"
          onIonInput={onChangeEndpoint}
          value={endpoint}
        />
        <IonSelect label="Page" value={page} onIonChange={onChangePage}>
          <IonSelectOption value="">Unset</IonSelectOption>
          <IonSelectOption value="login">Login</IonSelectOption>
          <IonSelectOption value="signup">Signup</IonSelectOption>
        </IonSelect>
        <IonSelect
          label="Color Scheme"
          value={colorScheme}
          onIonChange={onChangeColorScheme}
        >
          <IonSelectOption value="">Use system</IonSelectOption>
          <IonSelectOption value="light">Light</IonSelectOption>
          <IonSelectOption value="dark">Dark</IonSelectOption>
        </IonSelect>
        <IonToggle
          className="toggle"
          checked={useTransientTokenStorage}
          onIonChange={onChangeUseTransientTokenStorage}
        >
          Use TransientTokenStorage
        </IonToggle>
        <IonToggle
          className="toggle"
          checked={isSSOEnabled}
          onIonChange={onChangeIsSSOEnabled}
        >
          Is SSO Enabled
        </IonToggle>
        <div className="information">
          <IonLabel>Session State</IonLabel>
          <IonNote>{sessionState}</IonNote>
        </div>
        <IonButton
          className="button"
          disabled={loading}
          onClick={onClickConfigure}
        >
          Configure
        </IonButton>
        <IonButton
          className="button"
          disabled={!initialized || loading || loggedIn}
          onClick={onClickAuthenticate}
        >
          Authenticate
        </IonButton>
        <IonButton
          className="button"
          disabled={!initialized || loading || !loggedIn}
          onClick={onClickReauthenticate}
        >
          Re-authenticate
        </IonButton>
        <IonButton
          className="button"
          disabled={!initialized || !loggedIn}
          onClick={onClickOpenSettings}
        >
          Open settings
        </IonButton>
        <IonButton
          className="button"
          disabled={!initialized || loading || !loggedIn}
          onClick={onClickFetchUserInfo}
        >
          Fetch User Info
        </IonButton>
        <IonButton
          className="button"
          disabled={!initialized || loading || !loggedIn}
          onClick={onClickShowAuthTime}
        >
          Show Auth Time
        </IonButton>
        <IonButton
          className="button"
          disabled={!initialized || loading || !loggedIn}
          onClick={onClickLogout}
        >
          Logout
        </IonButton>
      </div>
    </>
  );
}

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{TITLE}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">{TITLE}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <AuthgearDemo />
      </IonContent>
    </IonPage>
  );
};

export default Home;
