import React, { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import authgear from "@authgear/web";
import "./App.css";

// Switch the session type by uncommenting.
const SESSION_TYPE = "refresh_token";
// const SESSION_TYPE = "cookie";

function readClientID(): string {
  return window.sessionStorage.getItem("authgear.demo.clientID") ?? "";
}

function readEndpoint(): string {
  return window.sessionStorage.getItem("authgear.demo.endpoint") ?? "";
}

function readTransientSession(): boolean {
  return (
    window.sessionStorage.getItem("authgear.demo.transientSession") === "true"
  );
}

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

function Root() {
  const initialClientID = readClientID();
  const initialEndpoint = readEndpoint();
  const initialTransientSession = readTransientSession();
  const [clientID, setClientID] = useState(initialClientID);
  const [endpoint, setEndpoint] = useState(initialEndpoint);
  const [transientSession, setTransientSession] = useState(
    initialTransientSession
  );
  const [error, setError] = useState<unknown>(null);
  const [userInfo, setUserInfo] = useState<unknown>(null);

  const configure = useCallback(
    (clientID: string, endpoint: string, transientSession: boolean) => {
      window.sessionStorage.setItem("authgear.demo.clientID", clientID);
      window.sessionStorage.setItem("authgear.demo.endpoint", endpoint);
      window.sessionStorage.setItem(
        "authgear.demo.transientSession",
        transientSession ? "true" : "false"
      );
      authgear
        .configure({
          endpoint,
          clientID,
          sessionType: SESSION_TYPE,
          transientSession: transientSession,
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

  useEffect(() => {
    if (initialClientID !== "" && initialEndpoint !== "") {
      configure(initialClientID, initialEndpoint, initialTransientSession);
    }
  }, [initialClientID, initialEndpoint, initialTransientSession, configure]);

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

  const onClickSignIn = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const redirectURI = window.location.origin + "/auth-redirect";
    authgear
      .startAuthorization({
        redirectURI,
      })
      .then(
        () => {},
        (err) => setError(err)
      );
  }, []);

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

  const onChangeTransientSession = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      setTransientSession(e.currentTarget.checked);
    },
    []
  );

  const onClickConfigure = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      configure(clientID, endpoint, transientSession);
    },
    [clientID, endpoint, transientSession, configure]
  );

  const onClickReauthenticate = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const redirectURI = window.location.origin + "/reauth-redirect";

      authgear.refreshIDToken().then(
        () => {
          if (authgear.canReauthenticate()) {
            authgear
              .startReauthentication({
                redirectURI,
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
    []
  );

  return (
    <div>
      <p>
        Enter Client ID and Endpoint, and then click Configure to initialize the
        SDK.
      </p>
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
        Transient Session
        <input
          className="input"
          type="checkbox"
          onChange={onChangeTransientSession}
          checked={transientSession}
        />
      </label>
      <button className="button" type="button" onClick={onClickConfigure}>
        Configure
      </button>
      <p>
        After that, click one of the following buttons to try different
        features.
      </p>
      {userInfo != null ? (
        <div className="button-group">
          <a
            className="button"
            href={endpoint + "/settings"}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Settings
          </a>
          <button
            className="button"
            type="button"
            onClick={onClickReauthenticate}
          >
            Reauthenticate
          </button>
          <button className="button" type="button" onClick={onClickSignOut}>
            Sign out
          </button>
        </div>
      ) : (
        <button className="button" type="button" onClick={onClickSignIn}>
          Sign In
        </button>
      )}
      {userInfo != null ? <pre>{JSON.stringify(userInfo, null, 2)}</pre> : null}
      <ShowError error={error} />
    </div>
  );
}

function AuthRedirect() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const clientID = readClientID();
    const endpoint = readEndpoint();
    const transientSession = readTransientSession();
    authgear
      .configure({
        clientID,
        endpoint,
        sessionType: SESSION_TYPE,
        transientSession: transientSession,
      })
      .then(
        () => {
          authgear.finishAuthorization().then(
            (_) => {
              navigate("/");
            },
            (err) => setError(err)
          );
        },
        (err) => setError(err)
      );
  }, [navigate]);

  return (
    <div>
      <p>Redirecting</p>
      <ShowError error={error} />
    </div>
  );
}

function ReauthRedirect() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const clientID = readClientID();
    const endpoint = readEndpoint();
    const transientSession = readTransientSession();
    authgear
      .configure({
        clientID,
        endpoint,
        sessionType: SESSION_TYPE,
        transientSession: transientSession,
      })
      .then(
        () => {
          authgear.finishReauthentication().then(
            (_) => {
              navigate("/");
            },
            (err) => setError(err)
          );
        },
        (err) => setError(err)
      );
  }, [navigate]);

  return (
    <div>
      <p>Redirecting</p>
      <ShowError error={error} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/auth-redirect" element={<AuthRedirect />} />
        <Route path="/reauth-redirect" element={<ReauthRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
