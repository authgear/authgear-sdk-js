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
  BiometricOptions,
  BiometricAccessConstraintIOS,
  BiometricLAPolicy,
  BiometricAccessConstraintAndroid,
  WebKitWebViewUIImplementation,
  DeviceBrowserUIImplementation,
} from "@authgear/capacitor";
import {
  readPreAuthenticatedURLClientID,
  readPreAuthenticatedURLRedirectURI,
  readClientID,
  readEndpoint,
  readIsPreAuthenticatedURLEnabled,
  readIsSSOEnabled,
  readUseWebKitWebView,
  writePreAuthenticatedURLClientID,
  writePreAuthenticatedURLRedirectURI,
  writeClientID,
  writeEndpoint,
  writeIsPreAuthenticatedURLEnabled,
  writeIsSSOEnabled,
  writeUseWebKitWebView,
} from "../storage";

import "./Home.css";

const TITLE = "Authgear SDK";

const REDIRECT_URI_WEB_AUTHENTICATE = "http://localhost:8100/oauth-redirect";
const REDIRECT_URI_WEB_REAUTH = "http://localhost:8100/reauth-redirect";
const REDIRECT_URI_CAPACITOR = "com.authgear.exampleapp.capacitor://host/path";

const biometricOptions: BiometricOptions = {
  ios: {
    localizedReason: "Use biometric to authenticate",
    constraint: BiometricAccessConstraintIOS.BiometryCurrentSet,
    policy: BiometricLAPolicy.deviceOwnerAuthenticationWithBiometrics,
  },
  android: {
    title: "Biometric Authentication",
    subtitle: "Biometric authentication",
    description: "Use biometric to authenticate",
    negativeButtonText: "Cancel",
    constraint: [BiometricAccessConstraintAndroid.BiometricStrong],
    invalidatedByBiometricEnrollment: true,
  },
};

function isPlatformWeb(): boolean {
  return Capacitor.getPlatform() === "web";
}

async function myfetch(
  input: URL | RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const request = new Request(input, init);
  request.headers.set("x-custom-header", "42");
  return fetch(request);
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
  const [authenticationFlowGroup, setAuthenticationFlowGroup] = useState("");
  const [page, setPage] = useState("");
  const [colorScheme, setColorScheme] = useState("");
  const [useTransientTokenStorage, setUseTransientTokenStorage] =
    useState(false);
  const [isSSOEnabled, setIsSSOEnabled] = useState(() => {
    return readIsSSOEnabled();
  });
  const [useWebKitWebView, setUseWebKitWebView] = useState<boolean>(() => {
    return readUseWebKitWebView();
  });
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const [preAuthenticatedURLEnabled, setIsPreAuthenticatedURLEnabled] =
    useState(() => {
      return readIsPreAuthenticatedURLEnabled();
    });

  const [preAuthenticatedURLClientID, setPreAuthenticatedURLClientID] =
    useState(() => {
      return readPreAuthenticatedURLClientID();
    });

  const [preAuthenticatedURLRedirectURI, setPreAuthenticatedURLRedirectURI] =
    useState(() => {
      return readPreAuthenticatedURLRedirectURI();
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

  const updateBiometricState = useCallback(async () => {
    if (isPlatformWeb()) {
      return;
    }

    try {
      await authgearCapacitor.checkBiometricSupported(biometricOptions);
      const enabled = await authgearCapacitor.isBiometricEnabled();
      setBiometricEnabled(enabled);
    } catch (e) {
      console.error(e);
    }
  }, []);

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
    const message = JSON.stringify(userInfo.raw, null, 2);
    setIsAlertOpen(true);
    setAlertHeader("UserInfo");
    setAlertMessage(message);
  }, []);

  const postConfigure = useCallback(async () => {
    await updateBiometricState();
    const sessionState = isPlatformWeb()
      ? authgearWeb.sessionState
      : authgearCapacitor.sessionState;
    if (sessionState !== "AUTHENTICATED") {
      setInitialized(true);
      return;
    }

    if (isPlatformWeb()) {
      const userInfo = await authgearWeb.fetchUserInfo();
      setUserInfo(userInfo);
    } else {
      const userInfo = await authgearCapacitor.fetchUserInfo();
      setUserInfo(userInfo);
    }

    setInitialized(true);
  }, [updateBiometricState]);

  const configure = useCallback(async () => {
    setLoading(true);
    try {
      writeClientID(clientID);
      writeEndpoint(endpoint);
      writeIsSSOEnabled(isSSOEnabled);
      writeUseWebKitWebView(useWebKitWebView);
      writeIsPreAuthenticatedURLEnabled(preAuthenticatedURLEnabled);
      writePreAuthenticatedURLClientID(preAuthenticatedURLClientID);
      writePreAuthenticatedURLRedirectURI(preAuthenticatedURLRedirectURI);

      if (isPlatformWeb()) {
        await authgearWeb.configure({
          clientID,
          endpoint,
          sessionType: "refresh_token",
          isSSOEnabled,
          fetch: myfetch,
        });
      } else {
        await authgearCapacitor.configure({
          clientID,
          endpoint,
          tokenStorage: useTransientTokenStorage
            ? new TransientTokenStorage()
            : new PersistentTokenStorage(),
          uiImplementation: useWebKitWebView
            ? new WebKitWebViewUIImplementation({
                ios: {
                  modalPresentationStyle: "fullScreen",
                  isInspectable: true,
                },
                android: {
                  actionBarBackgroundColor: 0x00ffffff,
                  actionBarButtonTintColor: 0xff000000,
                },
              })
            : undefined,
          isSSOEnabled,
          preAuthenticatedURLEnabled,
          fetch: myfetch,
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
    useWebKitWebView,
    preAuthenticatedURLEnabled,
    preAuthenticatedURLClientID,
    preAuthenticatedURLRedirectURI,
    postConfigure,
    useTransientTokenStorage,
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
          authenticationFlowGroup,
        });
        setUserInfo(result.userInfo);
        showUserInfo(result.userInfo);
      }
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
      await updateBiometricState();
    }
  }, [
    authenticationFlowGroup,
    colorScheme,
    page,
    showError,
    showUserInfo,
    updateBiometricState,
  ]);

  const enableBiometric = useCallback(async () => {
    setLoading(true);
    try {
      await authgearCapacitor.enableBiometric(biometricOptions);
    } catch (e: unknown) {
      showError(e);
    } finally {
      setLoading(false);
      await updateBiometricState();
    }
  }, [showError, updateBiometricState]);

  const authenticateBiometric = useCallback(async () => {
    setLoading(true);
    try {
      const { userInfo } = await authgearCapacitor.authenticateBiometric(
        biometricOptions
      );
      setUserInfo(userInfo);
      showUserInfo(userInfo);
    } catch (e: unknown) {
      showError(e);
    } finally {
      setLoading(false);
      await updateBiometricState();
    }
  }, [showError, showUserInfo, updateBiometricState]);

  const disableBiometric = useCallback(async () => {
    setLoading(true);
    try {
      await authgearCapacitor.disableBiometric();
    } catch (e: unknown) {
      showError(e);
    } finally {
      setLoading(false);
      await updateBiometricState();
    }
  }, [showError, updateBiometricState]);

  const startPreAuthenticatedURL = useCallback(async () => {
    const shouldUseAnotherBrowser = preAuthenticatedURLRedirectURI !== "";
    let targetRedirectURI = REDIRECT_URI_CAPACITOR;
    let targetClientID = clientID;
    if (preAuthenticatedURLRedirectURI !== "") {
      targetRedirectURI = preAuthenticatedURLRedirectURI;
    }
    if (preAuthenticatedURLClientID !== "") {
      targetClientID = preAuthenticatedURLClientID;
    }
    setLoading(true);
    try {
      const url = await authgearCapacitor.makePreAuthenticatedURL({
        webApplicationClientID: targetClientID,
        webApplicationURI: targetRedirectURI,
      });
      const uiImpl = new WebKitWebViewUIImplementation();
      if (!shouldUseAnotherBrowser) {
        // Use webkit webview to open the url and set the cookie
        await uiImpl.openAuthorizationURL({
          url: url,
          redirectURI: REDIRECT_URI_CAPACITOR,
          shareCookiesWithDeviceBrowser: true,
        });
        // Then start a auth to prove it is working
        const newContainer = new CapacitorContainer({
          name: "preAuthenticatedURL",
        });
        await newContainer.configure({
          endpoint: endpoint,
          tokenStorage: new TransientTokenStorage(),
          isSSOEnabled: true,
          clientID: targetClientID,
          uiImplementation: uiImpl,
        });
        await newContainer.authenticate({
          redirectURI: REDIRECT_URI_CAPACITOR,
        });
        const userInfo = await newContainer.fetchUserInfo();
        showUserInfo(userInfo);
      } else {
        // This willbe redirected to preAuthenticatedURLRedirectURI and never close,
        // so we do not await
        uiImpl
          .openAuthorizationURL({
            url: url,
            redirectURI: REDIRECT_URI_CAPACITOR,
            shareCookiesWithDeviceBrowser: true,
          })
          .then(() => {})
          .catch(() => {});
      }
    } catch (e: unknown) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [
    preAuthenticatedURLClientID,
    preAuthenticatedURLRedirectURI,
    clientID,
    endpoint,
    showError,
    showUserInfo,
  ]);

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

  const reauthenticateWebOnly = useCallback(async () => {
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
          authenticationFlowGroup,
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
  }, [authenticationFlowGroup, showError, colorScheme, showAuthTime]);

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
          authenticationFlowGroup,
        });
      } else {
        await authgearCapacitor.refreshIDToken();
        if (!authgearCapacitor.canReauthenticate()) {
          throw new Error(
            "canReauthenticate() returns false for the current user"
          );
        }

        await authgearCapacitor.reauthenticate(
          {
            redirectURI: REDIRECT_URI_CAPACITOR,
            colorScheme:
              colorScheme === "" ? undefined : (colorScheme as ColorScheme),
          },
          biometricOptions
        );
        showAuthTime();
      }
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [authenticationFlowGroup, showError, colorScheme, showAuthTime]);

  const openSettings = useCallback(async () => {
    setLoading(true);
    if (isPlatformWeb()) {
      await authgearWeb.open(WebPage.Settings);
    } else {
      try {
        await authgearCapacitor.open(CapacitorPage.Settings);
      } catch (e) {
        showError(e);
      } finally {
        setLoading(false);
      }
    }
  }, [showError]);

  const changePassword = useCallback(async () => {
    if (isPlatformWeb()) {
      // Not implemented.
    } else {
      authgearCapacitor.changePassword({
        redirectURI: REDIRECT_URI_CAPACITOR,
      });
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    if (isPlatformWeb()) {
      // Not implemented.
    } else {
      setLoading(true);
      try {
        await authgearCapacitor.deleteAccount({
          redirectURI: REDIRECT_URI_CAPACITOR,
        });
      } catch (e) {
        showError(e);
      } finally {
        setLoading(false);
      }
    }
  }, [showError]);

  const addEmail = useCallback(async () => {
    if (isPlatformWeb()) {
      // Not implemented.
    } else {
      authgearCapacitor.addEmail({
        redirectURI: REDIRECT_URI_CAPACITOR,
      });
    }
  }, []);

  const addPhone = useCallback(async () => {
    if (isPlatformWeb()) {
      // Not implemented.
    } else {
      authgearCapacitor.addPhone({
        redirectURI: REDIRECT_URI_CAPACITOR,
      });
    }
  }, []);

  const addUsername = useCallback(async () => {
    if (isPlatformWeb()) {
      // Not implemented.
    } else {
      authgearCapacitor.addUsername({
        redirectURI: REDIRECT_URI_CAPACITOR,
      });
    }
  }, []);

  const changeEmail = useCallback(async () => {
    if (isPlatformWeb()) {
      // Not implemented.
    } else {
      authgearCapacitor.changeEmail(userInfo?.email ?? "", {
        redirectURI: REDIRECT_URI_CAPACITOR,
      });
    }
  }, [userInfo]);

  const changePhone = useCallback(async () => {
    if (isPlatformWeb()) {
      // Not implemented.
    } else {
      authgearCapacitor.changePhone(userInfo?.phoneNumber ?? "", {
        redirectURI: REDIRECT_URI_CAPACITOR,
      });
    }
  }, [userInfo]);

  const changeUsername = useCallback(async () => {
    if (isPlatformWeb()) {
      // Not implemented.
    } else {
      authgearCapacitor.changeUsername(userInfo?.preferredUsername ?? "", {
        redirectURI: REDIRECT_URI_CAPACITOR,
      });
    }
  }, [userInfo]);

  const fetchUserInfo = useCallback(async () => {
    setLoading(true);
    try {
      if (isPlatformWeb()) {
        const userInfo = await authgearWeb.fetchUserInfo();
        setUserInfo(userInfo);
        showUserInfo(userInfo);
      } else {
        const userInfo = await authgearCapacitor.fetchUserInfo();
        setUserInfo(userInfo);
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

  const onChangeIsPreAuthenticatedURLEnabled = useCallback(
    (e: IonToggleCustomEvent<ToggleChangeEventDetail<unknown>>) => {
      setIsPreAuthenticatedURLEnabled(e.detail.checked);
    },
    []
  );

  const onChangePreAuthenticatedURLClientID = useCallback(
    (e: IonInputCustomEvent<InputInputEventDetail>) => {
      setPreAuthenticatedURLClientID(e.detail.value ?? "");
    },
    []
  );

  const onChangePreAuthenticatedURLRedirectURI = useCallback(
    (e: IonInputCustomEvent<InputInputEventDetail>) => {
      setPreAuthenticatedURLRedirectURI(e.detail.value ?? "");
    },
    []
  );

  const onChangeUseWebKitWebView = useCallback(
    (e: IonToggleCustomEvent<ToggleChangeEventDetail<unknown>>) => {
      setUseWebKitWebView(e.detail.checked);
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

  const onClickReauthenticateWebOnly = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      reauthenticateWebOnly();
    },
    [reauthenticateWebOnly]
  );

  const onClickEnableBiometric = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      enableBiometric();
    },
    [enableBiometric]
  );

  const onClickAuthenticateBiometric = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      authenticateBiometric();
    },
    [authenticateBiometric]
  );

  const onClickPreAuthenticatedURL = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      startPreAuthenticatedURL();
    },
    [startPreAuthenticatedURL]
  );

  const onClickDisableBiometric = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      disableBiometric();
    },
    [disableBiometric]
  );

  const onClickOpenSettings = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      openSettings();
    },
    [openSettings]
  );

  const onClickChangePassword = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      changePassword();
    },
    [changePassword]
  );

  const onClickDeleteAccount = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      deleteAccount();
    },
    [deleteAccount]
  );

  const onClickAddEmail = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      addEmail();
    },
    [addEmail]
  );

  const onClickAddPhone = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      addPhone();
    },
    [addPhone]
  );

  const onClickAddUsername = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      addUsername();
    },
    [addUsername]
  );

  const onClickChangeEmail = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      changeEmail();
    },
    [changeEmail]
  );

  const onClickChangePhone = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      changePhone();
    },
    [changePhone]
  );

  const onClickChangeUsername = useCallback(
    (e: MouseEvent<HTMLIonButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      changeUsername();
    },
    [changeUsername]
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

  const canUsePreAuthenticatedURL = !isPlatformWeb();

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
        <IonInput
          type="text"
          label="Authentication Flow Group"
          placeholder="Enter Authentication Flow Group"
          onIonInput={(e) => setAuthenticationFlowGroup(e.detail.value!)}
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
        <IonToggle
          className="toggle"
          checked={useWebKitWebView}
          onIonChange={onChangeUseWebKitWebView}
        >
          Use WebKit WebView
        </IonToggle>
        <div className="information">
          <IonLabel>Session State</IonLabel>
          <IonNote>{sessionState}</IonNote>
        </div>
        {!canUsePreAuthenticatedURL ? null : (
          <>
            <IonToggle
              className="toggle"
              checked={preAuthenticatedURLEnabled}
              onIonChange={onChangeIsPreAuthenticatedURLEnabled}
            >
              Is Pre Authenticated URL Enabled
            </IonToggle>
            <IonInput
              type="text"
              label="Pre Authenticated URL Client ID"
              placeholder="Enter Client ID"
              onIonInput={onChangePreAuthenticatedURLClientID}
              value={preAuthenticatedURLClientID}
            />
            <IonInput
              type="text"
              label="Pre Authenticated URL Redirect URI"
              placeholder="Enter URI"
              onIonInput={onChangePreAuthenticatedURLRedirectURI}
              value={preAuthenticatedURLRedirectURI}
            />
          </>
        )}
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
          onClick={onClickReauthenticateWebOnly}
        >
          Re-authenticate
        </IonButton>
        <IonButton
          className="button"
          disabled={!initialized || loading || !loggedIn}
          onClick={onClickReauthenticate}
        >
          Re-authenticate (biometric or web)
        </IonButton>
        {isPlatformWeb() ? null : (
          <IonButton
            className="button"
            disabled={!initialized || loading || !loggedIn || biometricEnabled}
            onClick={onClickEnableBiometric}
          >
            Enable biometric
          </IonButton>
        )}
        <IonButton
          className="button"
          disabled={!initialized || loading || !biometricEnabled}
          onClick={onClickDisableBiometric}
        >
          Disable biometric
        </IonButton>
        <IonButton
          className="button"
          disabled={!initialized || loading || loggedIn || !biometricEnabled}
          onClick={onClickAuthenticateBiometric}
        >
          Authenticate with biometric
        </IonButton>
        {!canUsePreAuthenticatedURL ? null : (
          <IonButton
            className="button"
            disabled={
              !initialized ||
              loading ||
              !loggedIn ||
              !preAuthenticatedURLEnabled
            }
            onClick={onClickPreAuthenticatedURL}
          >
            Pre Authenticated URL
          </IonButton>
        )}
        <IonButton
          className="button"
          disabled={!initialized || !loggedIn}
          onClick={onClickOpenSettings}
        >
          Open settings
        </IonButton>
        {isPlatformWeb() ? null : (
          <IonButton
            className="button"
            disabled={!initialized || !loggedIn}
            onClick={onClickChangePassword}
          >
            Change password
          </IonButton>
        )}
        {isPlatformWeb() ? null : (
          <IonButton
            className="button"
            disabled={!initialized || !loggedIn}
            onClick={onClickDeleteAccount}
          >
            Delete Account
          </IonButton>
        )}
        {isPlatformWeb() ? null : (
          <IonButton
            className="button"
            disabled={!initialized || !loggedIn || userInfo?.email != null}
            onClick={onClickAddEmail}
          >
            Add Email
          </IonButton>
        )}
        {isPlatformWeb() ? null : (
          <IonButton
            className="button"
            disabled={
              !initialized || !loggedIn || userInfo?.phoneNumber != null
            }
            onClick={onClickAddPhone}
          >
            Add Phone
          </IonButton>
        )}
        {isPlatformWeb() ? null : (
          <IonButton
            className="button"
            disabled={
              !initialized || !loggedIn || userInfo?.preferredUsername != null
            }
            onClick={onClickAddUsername}
          >
            Add Username
          </IonButton>
        )}
        {isPlatformWeb() ? null : (
          <IonButton
            className="button"
            disabled={!initialized || !loggedIn || userInfo?.email == null}
            onClick={onClickChangeEmail}
          >
            Change Email
          </IonButton>
        )}
        {isPlatformWeb() ? null : (
          <IonButton
            className="button"
            disabled={
              !initialized || !loggedIn || userInfo?.phoneNumber == null
            }
            onClick={onClickChangePhone}
          >
            Change Phone
          </IonButton>
        )}
        {isPlatformWeb() ? null : (
          <IonButton
            className="button"
            disabled={
              !initialized || !loggedIn || userInfo?.preferredUsername == null
            }
            onClick={onClickChangeUsername}
          >
            Change Username
          </IonButton>
        )}
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
