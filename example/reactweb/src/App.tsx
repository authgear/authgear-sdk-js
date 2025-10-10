import React, { useEffect, useState, useCallback, useMemo } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import authgear, {
  UserInfo,
  ConfigureOptions,
  Page,
  WebContainerDelegate,
  SessionState,
} from "@authgear/web";
import "./App.css";

type SessionType = NonNullable<ConfigureOptions["sessionType"]>;

function isSessionType(v: unknown): v is SessionType {
  return v === "refresh_token" || v === "cookie";
}

function readSessionType(): SessionType {
  const v = window.localStorage.getItem("authgear.demo.sessionType") ?? "";
  if (isSessionType(v)) {
    return v;
  }
  return "refresh_token";
}

function readClientID(): string {
  return window.localStorage.getItem("authgear.demo.clientID") ?? "";
}

function readEndpoint(): string {
  return window.localStorage.getItem("authgear.demo.endpoint") ?? "";
}

function readIsSSOEnabled(): boolean {
  return window.localStorage.getItem("authgear.demo.isSSOEnabled") === "true";
}

function makeRedirectURI(): string {
  return window.location.origin + "/auth-redirect";
}

function getOAuthState(): OAuthState | undefined {
  const u = new URL(window.location.href);
  const searchParams = u.searchParams;
  const state = searchParams.get("state");
  switch (state) {
    case "authenticate":
      return "authenticate";
    case "reauthenticate":
      return "reauthenticate";
    case "promote":
      return "promote";
    case "change_password":
      return "change_password";
    case "delete_account":
      return "delete_account";
    case "add_email":
      return "add_email";
    case "add_phone":
      return "add_phone";
    case "add_username":
      return "add_username";
    case "change_email":
      return "change_email";
    case "change_phone":
      return "change_phone";
    case "change_username":
      return "change_username";
  }
  return undefined;
}

type OAuthState =
  | "authenticate"
  | "reauthenticate"
  | "promote"
  | "change_password"
  | "delete_account"
  | "add_email"
  | "add_phone"
  | "add_username"
  | "change_email"
  | "change_phone"
  | "change_username";

function ShowError(props: { error: unknown }) {
  const { error } = props;
  if (error == null) {
    return null;
  }

  const data: Record<string, any> = {};
  if (error instanceof Error) {
    for (const key of Object.getOwnPropertyNames(error)) {
      data[key] = (error as any)[key];
    }
  } else {
    data["repr"] = String(error);
  }

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

async function myfetch(
  input: URL | RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const request = new Request(input, init);
  request.headers.set("x-custom-header", "42");
  return fetch(request);
}

function Root() {
  const initialClientID = readClientID();
  const initialEndpoint = readEndpoint();
  const initialSessionType = readSessionType();
  const initialIsSSOEnabled = readIsSSOEnabled();

  const [sessionType, setSessionType] = useState(initialSessionType);
  const [clientID, setClientID] = useState(initialClientID);
  const [endpoint, setEndpoint] = useState(initialEndpoint);
  const [isSSOEnabled, setIsSSOEnabled] = useState(initialIsSSOEnabled);
  const [page, setPage] = useState<string>();
  const [authenticationFlowGroup, setAuthenticationflowGroup] =
    useState<string>("");

  const [error, setError] = useState<unknown>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [sessionState, setSessionState] = useState<SessionState | null>(
    authgear.sessionState
  );

  const configure = useCallback(
    (
      sessionType: SessionType,
      clientID: string,
      endpoint: string,
      isSSOEnabled: boolean
    ) => {
      window.localStorage.setItem("authgear.demo.sessionType", sessionType);
      window.localStorage.setItem("authgear.demo.clientID", clientID);
      window.localStorage.setItem("authgear.demo.endpoint", endpoint);
      window.localStorage.setItem(
        "authgear.demo.isSSOEnabled",
        isSSOEnabled ? "true" : "false"
      );
      authgear
        .configure({
          endpoint,
          clientID,
          sessionType,
          isSSOEnabled,
          fetch: myfetch,
        })
        .then(
          () => {
            authgear.fetchUserInfo().then(
              (userInfo) => {
                setUserInfo(userInfo);
              },
              (err) => {
                setUserInfo(null);
              }
            );
          },
          (err) => setError(err)
        );
    },
    []
  );

  const delegate: WebContainerDelegate = useMemo(() => {
    return {
      onSessionStateChange(container, _) {
        setSessionState(container.sessionState);
      },
    };
  }, [setSessionState]);

  useEffect(() => {
    if (initialClientID !== "" && initialEndpoint !== "") {
      configure(
        initialSessionType,
        initialClientID,
        initialEndpoint,
        initialIsSSOEnabled
      );
    }
  }, [
    initialSessionType,
    initialClientID,
    initialEndpoint,
    initialIsSSOEnabled,
    configure,
  ]);

  useEffect(() => {
    authgear.delegate = delegate;

    return () => {
      authgear.delegate = undefined;
    };
  }, [delegate]);

  const onClickOpenSettings = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      authgear.open(Page.Settings).catch((err) => setError(err));
    },
    []
  );

  const onClickChangePassword = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      authgear
        .startChangePassword({
          redirectURI: makeRedirectURI(),
          state: "change_password",
        })
        .catch((err) => setError(err));
    },
    []
  );

  const onClickDeleteAccount = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      authgear
        .startDeleteAccount({
          redirectURI: makeRedirectURI(),
          state: "delete_account",
        })
        .catch((err) => setError(err));
    },
    []
  );

  const onClickSignOut = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    authgear
      .logout({
        redirectURI: window.location.origin + "/",
      })
      .then(
        () => {
          setUserInfo(null);
        },
        (err) => setError(err)
      );
  }, []);

  const onClickAddEmail = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    authgear
      .startAddEmail({
        redirectURI: makeRedirectURI(),
        state: "add_email",
      })
      .catch((err) => setError(err));
  }, []);

  const onClickAddPhone = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    authgear
      .startAddPhone({
        redirectURI: makeRedirectURI(),
        state: "add_phone",
      })
      .catch((err) => setError(err));
  }, []);

  const onClickAddUsername = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    authgear
      .startAddUsername({
        redirectURI: makeRedirectURI(),
        state: "add_username",
      })
      .catch((err) => setError(err));
  }, []);

  const onClickChangeEmail = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (userInfo?.email == null) {
        setError(new Error("Email is not available"));
        return;
      }
      authgear
        .startChangeEmail(userInfo.email, {
          redirectURI: makeRedirectURI(),
          state: "change_email",
        })
        .catch((err) => setError(err));
    },
    [userInfo]
  );

  const onClickChangePhone = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (userInfo?.phoneNumber == null) {
        setError(new Error("Phone number is not available"));
        return;
      }
      authgear
        .startChangePhone(userInfo.phoneNumber, {
          redirectURI: makeRedirectURI(),
          state: "change_phone",
        })
        .catch((err) => setError(err));
    },
    [userInfo]
  );

  const onClickChangeUsername = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (userInfo?.preferredUsername == null) {
        setError(new Error("Username is not available"));
        return;
      }
      authgear
        .startChangeUsername(userInfo.preferredUsername, {
          redirectURI: makeRedirectURI(),
          state: "change_username",
        })
        .catch((err) => setError(err));
    },
    [userInfo]
  );

  const onClickSignIn = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      authgear
        .startAuthentication({
          redirectURI: makeRedirectURI(),
          state: "authenticate",
          page,
          authenticationFlowGroup,
        })
        .then(
          () => {},
          (err) => setError(err)
        );
    },
    [page, authenticationFlowGroup]
  );

  const onClickSignInAnonymously = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      authgear.authenticateAnonymously().then(
        ({ userInfo }) => {
          setUserInfo(userInfo);
        },
        (err) => setError(err)
      );
    },
    []
  );

  const onChangeSessionType = useCallback(
    (e: React.FormEvent<HTMLSelectElement>) => {
      if (isSessionType(e.currentTarget.value)) {
        setSessionType(e.currentTarget.value);
      }
    },
    []
  );

  const onChangeClientID = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      setClientID(e.currentTarget.value);
    },
    []
  );

  const onChangeEndpoint = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      setEndpoint(e.currentTarget.value);
    },
    []
  );

  const onChangeIsSSOEnabled = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      setIsSSOEnabled(e.currentTarget.checked);
    },
    []
  );

  const onClickConfigure = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      configure(sessionType, clientID, endpoint, isSSOEnabled);
    },
    [sessionType, clientID, endpoint, isSSOEnabled, configure]
  );

  const onClickReauthenticate = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      authgear.refreshIDToken().then(
        () => {
          if (authgear.canReauthenticate()) {
            authgear
              .startReauthentication({
                redirectURI: makeRedirectURI(),
                state: "reauthenticate",
                authenticationFlowGroup,
              })
              .then(
                () => {},
                (err) => setError(err)
              );
          } else {
            setError(
              new Error(
                "canReauthenticate() returns false for the current user"
              )
            );
          }
        },
        (err) => setError(err)
      );
    },
    [authenticationFlowGroup]
  );

  const onClickPromoteAnonymousUser = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      authgear
        .startPromoteAnonymousUser({
          redirectURI: makeRedirectURI(),
          state: "promote",
        })
        .then(
          () => {},
          (err) => setError(err)
        );
    },
    []
  );

  const onClickShowAuthTime = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      window.alert(`auth_time: ${authgear.getAuthTime()}`);
    },
    []
  );

  const onClickFetchUserInfo = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      authgear.fetchUserInfo().then(
        (userInfo) => {
          setUserInfo(userInfo);
        },
        (err) => {
          setError(err);
        }
      );
    },
    []
  );

  return (
    <div>
      <p>
        Enter Client ID and Endpoint, and then click Configure to initialize the
        SDK.
      </p>
      <label className="label">
        Session Type
        <select
          className="input"
          value={sessionType}
          onChange={onChangeSessionType}
        >
          <option value="refresh_token">refresh_token</option>
          <option value="cookie">cookie</option>
        </select>
      </label>
      <label className="label">
        Client ID
        <input
          className="input"
          type="text"
          placeholder="Enter Client ID"
          value={clientID}
          onChange={onChangeClientID}
        />
      </label>
      <label className="label">
        Endpoint
        <input
          className="input"
          type="text"
          placeholder="Enter Endpoint"
          value={endpoint}
          onChange={onChangeEndpoint}
        />
      </label>
      <label className="label">
        Authentication Flow Group
        <input
          className="input"
          type="text"
          placeholder="Enter Flow Group"
          value={authenticationFlowGroup}
          onChange={(e) => setAuthenticationflowGroup(e.currentTarget.value)}
        />
      </label>
      <label className="label">
        Page
        <select
          className="input"
          value={page}
          onChange={(e) => setPage(e.currentTarget.value)}
        >
          <option value={undefined}>Unset</option>
          <option value="signup">Signup</option>
          <option value="login">Login</option>
        </select>
      </label>
      <label className="label">
        Is SSO Enabled
        <input
          className="input"
          type="checkbox"
          checked={isSSOEnabled}
          onChange={onChangeIsSSOEnabled}
        />
      </label>
      <label className="label">{`SessionState: ${sessionState}`}</label>
      <button className="button" type="button" onClick={onClickConfigure}>
        Configure
      </button>
      <p>
        After that, click one of the following buttons to try different
        features.
      </p>
      {sessionState === SessionState.Authenticated ? (
        <div className="button-group">
          <button
            className="button"
            type="button"
            onClick={onClickReauthenticate}
          >
            Reauthenticate
          </button>
          <button
            className="button"
            type="button"
            onClick={onClickFetchUserInfo}
          >
            Fetch User Info
          </button>
          <button
            className="button"
            type="button"
            onClick={onClickShowAuthTime}
          >
            Show auth_time
          </button>
          {userInfo != null && userInfo.isAnonymous ? (
            <button
              className="button"
              type="button"
              onClick={onClickPromoteAnonymousUser}
            >
              Promote Anonymous User
            </button>
          ) : null}
          <button
            className="button"
            type="button"
            onClick={onClickOpenSettings}
          >
            Open Settings
          </button>
          <button
            className="button"
            type="button"
            onClick={onClickChangePassword}
          >
            Change Password
          </button>
          <button
            className="button"
            type="button"
            onClick={onClickDeleteAccount}
          >
            Delete Account
          </button>
          <button
            className="button"
            type="button"
            onClick={onClickAddEmail}
            disabled={userInfo?.email != null}
          >
            Add Email
          </button>
          <button
            className="button"
            type="button"
            onClick={onClickAddPhone}
            disabled={userInfo?.phoneNumber != null}
          >
            Add Phone
          </button>
          <button
            className="button"
            type="button"
            onClick={onClickAddUsername}
            disabled={userInfo?.preferredUsername != null}
          >
            Add Username
          </button>
          <button
            className="button"
            type="button"
            onClick={onClickChangeEmail}
            disabled={userInfo?.email == null}
          >
            Change Email
          </button>
          <button
            className="button"
            type="button"
            onClick={onClickChangePhone}
            disabled={userInfo?.phoneNumber == null}
          >
            Change Phone
          </button>
          <button
            className="button"
            type="button"
            onClick={onClickChangeUsername}
            disabled={userInfo?.preferredUsername == null}
          >
            Change Username
          </button>
          <button className="button" type="button" onClick={onClickSignOut}>
            Sign out
          </button>
        </div>
      ) : (
        <div className="button-group">
          <button className="button" type="button" onClick={onClickSignIn}>
            Sign In
          </button>
          <button
            className="button"
            type="button"
            onClick={onClickSignInAnonymously}
          >
            Sign In Anonymously
          </button>
        </div>
      )}
      {sessionState === SessionState.Authenticated && userInfo != null ? (
        <pre>{JSON.stringify(userInfo.raw, null, 2)}</pre>
      ) : null}
      <ShowError error={error} />
    </div>
  );
}

function AuthRedirect() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const sessionType = readSessionType();
    const clientID = readClientID();
    const endpoint = readEndpoint();
    const isSSOEnabled = readIsSSOEnabled();

    const oauthState = getOAuthState();

    authgear
      .configure({
        clientID,
        endpoint,
        sessionType,
        isSSOEnabled,
      })
      .then(
        () => {
          switch (oauthState) {
            case "authenticate":
              authgear.finishAuthentication().then(
                (_) => {
                  navigate("/");
                },
                (err) => setError(err)
              );
              break;
            case "reauthenticate":
              authgear.finishReauthentication().then(
                (_) => {
                  navigate("/");
                },
                (err) => setError(err)
              );
              break;
            case "promote":
              authgear.finishPromoteAnonymousUser().then(
                (_) => {
                  navigate("/");
                },
                (err) => setError(err)
              );
              break;
            case "change_password":
              authgear.finishChangePassword().then(
                (_) => {
                  navigate("/");
                },
                (err) => setError(err)
              );
              break;
            case "delete_account":
              authgear.finishDeleteAccount().then(
                (_) => {
                  navigate("/");
                },
                (err) => setError(err)
              );
              break;
            case "add_email":
              authgear.finishAddEmail().then(
                (_) => {
                  navigate("/");
                },
                (err) => setError(err)
              );
              break;
            case "add_phone":
              authgear.finishAddPhone().then(
                (_) => {
                  navigate("/");
                },
                (err) => setError(err)
              );
              break;
            case "add_username":
              authgear.finishAddUsername().then(
                (_) => {
                  navigate("/");
                },
                (err) => setError(err)
              );
              break;
            case "change_email":
              authgear.finishChangeEmail().then(
                (_) => {
                  navigate("/");
                },
                (err) => setError(err)
              );
              break;
            case "change_phone":
              authgear.finishChangePhone().then(
                (_) => {
                  navigate("/");
                },
                (err) => setError(err)
              );
              break;
            case "change_username":
              authgear.finishChangeUsername().then(
                (_) => {
                  navigate("/");
                },
                (err) => setError(err)
              );
              break;
            default:
              throw new Error("unknown oauth state: " + oauthState);
          }
        },
        (err) => setError(err)
      );
  }, [navigate]);

  return (
    <div>
      <p>Redirecting</p>
      <ShowError error={error} />
      <a href="/">Back to home</a>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/auth-redirect" element={<AuthRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
