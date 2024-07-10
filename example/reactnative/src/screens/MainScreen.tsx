import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  Button,
  View,
  Alert,
  TextInput,
  Platform,
  NativeModules,
  Switch,
  useColorScheme,
} from 'react-native';
import authgear, {
  Page,
  ReactNativeContainer,
  ReactNativeContainerDelegate,
  SessionStateChangeReason,
  UserInfo,
  CancelError,
  BiometricPrivateKeyNotFoundError,
  BiometricNotSupportedOrPermissionDeniedError,
  BiometricNoEnrollmentError,
  BiometricNoPasscodeError,
  BiometricLockoutError,
  TransientTokenStorage,
  PersistentTokenStorage,
  ColorScheme,
  BiometricOptions,
  BiometricAccessConstraintIOS,
  BiometricLAPolicy,
  BiometricAccessConstraintAndroid,
  SessionState,
  WebKitWebViewUIImplementation,
  DeviceBrowserUIImplementation,
} from '@authgear/react-native';
import RadioGroup, {RadioGroupItemProps} from '../RadioGroup';

const styles = StyleSheet.create({
  root: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'column',
  },
  configure: {
    marginBottom: 15,
  },
  configureDesc: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  configureDescText: {
    fontSize: 15,
    color: '#888888',
    marginBottom: 20,
  },
  input: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontWeight: '600',
    color: '#707070',
    fontSize: 15,
    width: 120,
  },
  inputField: {
    flex: 1,
    paddingBottom: 5,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderColor: '#888888',
    fontSize: 16,
  },
  radioGroup: {
    flex: 1,
  },
  textValue: {
    flex: 1,
    fontWeight: '600',
    color: '#707070',
    fontSize: 15,
    textAlign: 'right',
  },
  configureAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  optionsContainer: {
    flexDirection: 'column',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
  },
  checkboxDesc: {
    width: 100,
    fontSize: 14,
    color: '#888888',
  },
  checkbox: {
    marginLeft: 8,
  },
  actionDesc: {
    fontSize: 15,
    color: '#888888',
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    marginBottom: 20,
  },
});

const redirectURI = 'com.authgear.example.rn://host/path';
const wechatRedirectURI = Platform.select<string>({
  android: 'com.authgear.example.rn://host/open_wechat_app',
  ios: 'https://authgear-demo-rn.pandawork.com/authgear/open_wechat_app',
});

const biometricOptions: BiometricOptions = {
  ios: {
    localizedReason: 'Use biometric to authenticate',
    constraint: BiometricAccessConstraintIOS.BiometryCurrentSet,
    policy: BiometricLAPolicy.deviceOwnerAuthenticationWithBiometrics,
  },
  android: {
    title: 'Biometric Authentication',
    subtitle: 'Biometric authentication',
    description: 'Use biometric to authenticate',
    negativeButtonText: 'Cancel',
    constraint: [BiometricAccessConstraintAndroid.BiometricStrong],
    invalidatedByBiometricEnrollment: true,
  },
};

const HomeScreen: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientID, setClientID] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [authenticationFlowGroup, setAuthenticationflowGroup] = useState('');
  const [page, setPage] = useState('');
  const [explicitColorScheme, setExplicitColorScheme] =
    useState<ColorScheme | null>(null);
  const [useTransientTokenStorage, setUseTransientTokenStorage] =
    useState(false);
  const [isSSOEnabled, setIsSSOEnabled] = useState(false);
  const [useWebKitWebView, setUseWebKitWebView] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);

  const [preAuthenticatedURLEnabled, setIsAppInitiatedSSOToWebEnabled] =
    useState(false);
  const [appInitiatedSSOToWebClientID, setAppInitiatedSSOToWebClientID] =
    useState('');
  const [appInitiatedSSOToWebRedirectURI, setAppInitiatedSSOToWebRedirectURI] =
    useState('');

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [sessionState, setSessionState] = useState<SessionState | null>(
    authgear.sessionState,
  );
  const loggedIn = userInfo != null;

  const pageItems = useMemo(() => {
    return [
      {
        label: 'Unset',
        value: '',
      },
      {
        label: 'Login',
        value: 'login',
      },
      {
        label: 'Signup',
        value: 'signup',
      },
    ];
  }, []);

  const colorSchemeItems: RadioGroupItemProps<ColorScheme | null>[] =
    useMemo(() => {
      return [
        {
          label: 'Use system',
          value: null,
        },
        {
          label: 'Light',
          value: ColorScheme.Light,
        },
        {
          label: 'Dark',
          value: ColorScheme.Dark,
        },
      ];
    }, []);

  const systemColorSchemeNull = useColorScheme();
  const systemColorScheme = systemColorSchemeNull ?? undefined;

  const colorScheme = explicitColorScheme ?? systemColorScheme;

  const showUser = useCallback((userInfo: UserInfo) => {
    Alert.alert('User Info', JSON.stringify(userInfo.raw, null, 2));
  }, []);

  const showError = useCallback((e: any) => {
    const json = JSON.parse(JSON.stringify(e));
    delete json['line'];
    delete json['column'];
    delete json['sourceURL'];
    json['constructor.name'] = e?.constructor?.name;
    json['message'] = e.message;
    const title = 'Error';
    let message = JSON.stringify(json);

    if (e instanceof CancelError) {
      // Cancel is not an error actually.
      return;
    }

    if (e instanceof BiometricPrivateKeyNotFoundError) {
      message = Platform.select({
        android:
          'Your biometric info has changed. For security reason, you have to set up biometric authentication again.',
        ios: 'Your Touch ID or Face ID has changed. For security reason, you have to set up biometric authentication again.',
        default: message,
      });
    }

    if (e instanceof BiometricNoEnrollmentError) {
      message = Platform.select({
        android:
          'You have not set up biometric yet. Please set up your fingerprint or face',
        ios: 'You do not have Face ID or Touch ID set up yet. Please set it up first',
        default: message,
      });
    }

    if (e instanceof BiometricNotSupportedOrPermissionDeniedError) {
      message = Platform.select({
        android:
          'Your device does not support biometric. The developer should have checked this and not letting you to see feature that requires biometric',
        ios: 'If the developer should performed checking, then it is likely that you have denied the permission of Face ID. Please enable it in Settings',
        default: message,
      });
    }

    if (e instanceof BiometricNoPasscodeError) {
      message = Platform.select({
        android:
          'You device does not have credential set up. Please set up either a PIN, a pattern or a password',
        ios: 'You device does not have passcode set up. Please set up a passcode',
        default: message,
      });
    }

    if (e instanceof BiometricLockoutError) {
      message =
        'The biometric is locked out due to too many failed attempts. The developer should handle this error by using normal authentication as a fallback. So normally you should not see this error';
    }

    Alert.alert(title, message);
  }, []);

  const updateBiometricState = useCallback(() => {
    authgear
      .checkBiometricSupported(biometricOptions)
      .then(() => {
        authgear
          .isBiometricEnabled()
          .then(enabled => {
            setBiometricEnabled(enabled);
          })
          .catch(() => {
            // ignore the error.
          });
      })
      .catch(() => {
        // ignore the error.
      });
  }, []);

  const delegate: ReactNativeContainerDelegate = useMemo(() => {
    const d: ReactNativeContainerDelegate = {
      onSessionStateChange: (
        container: ReactNativeContainer,
        _reason: SessionStateChangeReason,
      ) => {
        setSessionState(container.sessionState);
        if (container.sessionState !== 'AUTHENTICATED') {
          setUserInfo(null);
        }
      },
      sendWechatAuthRequest: state => {
        console.log('user click login with wechat, open wechat sdk');
        const {WechatAuth} = NativeModules;
        WechatAuth.sendWechatAuthRequest(state)
          .then((result: {code: string; state: string}) => {
            console.log('sending wechat auth callback');
            return authgear.wechatAuthCallback(result.code, result.state);
          })
          .then(() => {
            console.log('send wechat auth callback successfully');
          })
          .catch((err: Error) => {
            showError(err);
          });
      },
    };
    return d;
  }, [setSessionState, setUserInfo, showError]);

  useEffect(() => {
    authgear.delegate = delegate;

    return () => {
      authgear.delegate = undefined;
    };
  }, [delegate]);

  const postConfigure = useCallback(() => {
    updateBiometricState();
    if (authgear.sessionState !== 'AUTHENTICATED') {
      setInitialized(true);
      return;
    }
    authgear
      .fetchUserInfo()
      .then(userInfo => {
        setUserInfo(userInfo);
      })
      .catch(e => {
        showError(e);
      })
      .finally(() => {
        setInitialized(true);
      });
  }, [updateBiometricState, showError]);

  const configure = useCallback(() => {
    setLoading(true);
    if (clientID === '' || endpoint === '') {
      Alert.alert('Error', 'Please fill in client ID and endpoint');
      return;
    }
    authgear
      .configure({
        clientID,
        endpoint,
        tokenStorage: useTransientTokenStorage
          ? new TransientTokenStorage()
          : new PersistentTokenStorage(),
        uiImplementation: useWebKitWebView
          ? new WebKitWebViewUIImplementation({
              ios: {
                modalPresentationStyle: 'fullScreen',
                isInspectable: true,
              },
            })
          : undefined,
        isSSOEnabled,
        preAuthenticatedURLEnabled,
      })
      .then(() => {
        postConfigure();
        Alert.alert('Success', 'Configured Authgear container successfully');
      })
      .catch(e => {
        showError(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    clientID,
    endpoint,
    useTransientTokenStorage,
    isSSOEnabled,
    preAuthenticatedURLEnabled,
    useWebKitWebView,
    postConfigure,
    showError,
  ]);

  const login = useCallback(() => {
    setLoading(true);
    authgear
      .authenticate({
        redirectURI,
        wechatRedirectURI,
        colorScheme: colorScheme as ColorScheme,
        page,
        authenticationFlowGroup,
      })
      .then(({userInfo}) => {
        setUserInfo(userInfo);
        showUser(userInfo);
      })
      .catch(e => {
        showError(e);
      })
      .finally(() => {
        setLoading(false);
        updateBiometricState();
      });
  }, [
    page,
    authenticationFlowGroup,
    updateBiometricState,
    showError,
    showUser,
    colorScheme,
  ]);

  const loginAnonymously = useCallback(() => {
    setLoading(true);
    authgear
      .authenticateAnonymously()
      .then(({userInfo}) => {
        setUserInfo(userInfo);
        showUser(userInfo);
      })
      .catch(err => {
        showError(err);
      })
      .finally(() => {
        setLoading(false);
        updateBiometricState();
      });
  }, [showError, showUser, updateBiometricState]);

  const promoteAnonymousUser = useCallback(() => {
    setLoading(true);
    authgear
      .promoteAnonymousUser({
        redirectURI,
        colorScheme: colorScheme as ColorScheme,
        wechatRedirectURI,
      })
      .then(({userInfo}) => {
        setUserInfo(userInfo);
        showUser(userInfo);
      })
      .catch(e => showError(e))
      .finally(() => {
        updateBiometricState();
        setLoading(false);
      });
  }, [showError, showUser, updateBiometricState, colorScheme]);

  const reauthenticate = useCallback(() => {
    async function task() {
      await authgear.refreshIDToken();
      if (!authgear.canReauthenticate()) {
        throw new Error(
          'canReauthenticate() returns false for the current user',
        );
      }

      const {userInfo} = await authgear.reauthenticate(
        {
          redirectURI,
          colorScheme: colorScheme as ColorScheme,
          wechatRedirectURI,
          authenticationFlowGroup,
        },
        biometricOptions,
      );

      setUserInfo(userInfo);
      showUser(userInfo);
    }

    setLoading(true);
    task()
      .catch(e => {
        showError(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authenticationFlowGroup, showError, showUser, colorScheme]);

  const reauthenticateWebOnly = useCallback(() => {
    async function task() {
      await authgear.refreshIDToken();
      if (!authgear.canReauthenticate()) {
        throw new Error(
          'canReauthenticate() returns false for the current user',
        );
      }

      const {userInfo} = await authgear.reauthenticate({
        redirectURI,
        colorScheme: colorScheme as ColorScheme,
        wechatRedirectURI,
        authenticationFlowGroup,
      });

      setUserInfo(userInfo);
      showUser(userInfo);
    }

    setLoading(true);
    task()
      .catch(e => {
        showError(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authenticationFlowGroup, showError, showUser, colorScheme]);

  const enableBiometric = useCallback(() => {
    setLoading(true);
    authgear
      .enableBiometric(biometricOptions)
      .catch(err => {
        showError(err);
      })
      .finally(() => {
        setLoading(false);
        updateBiometricState();
      });
  }, [showError, updateBiometricState]);

  const authenticateBiometric = useCallback(() => {
    setLoading(true);
    authgear
      .authenticateBiometric(biometricOptions)
      .then(({userInfo}) => {
        setUserInfo(userInfo);
        showUser(userInfo);
      })
      .catch(e => showError(e))
      .finally(() => {
        updateBiometricState();
        setLoading(false);
      });
  }, [showError, showUser, updateBiometricState]);

  const disableBiometric = useCallback(() => {
    setLoading(true);
    authgear
      .disableBiometric()
      .catch(err => {
        showError(err);
      })
      .finally(() => {
        setLoading(false);
        updateBiometricState();
      });
  }, [showError, updateBiometricState]);

  const startAppInitiatedSSOToWeb = useCallback(async () => {
    setLoading(true);
    const shouldUseAnotherBrowser = appInitiatedSSOToWebRedirectURI !== '';
    let targetRedirectURI = redirectURI;
    let targetClientID = clientID;
    if (appInitiatedSSOToWebRedirectURI !== '') {
      targetRedirectURI = appInitiatedSSOToWebRedirectURI;
    }
    if (appInitiatedSSOToWebClientID !== '') {
      targetClientID = appInitiatedSSOToWebClientID;
    }
    try {
      const url = await authgear.makeAppInitiatedSSOToWebURL({
        clientID: targetClientID,
        redirectURI: targetRedirectURI,
      });
      const uiImpl = new WebKitWebViewUIImplementation();
      if (!shouldUseAnotherBrowser) {
        // Use webkit webview to open the url and set the cookie
        await uiImpl.openAuthorizationURL({
          url: url,
          redirectURI: redirectURI,
          shareCookiesWithDeviceBrowser: true,
        });
        // Then start a auth to prove it is working
        const newContainer = new ReactNativeContainer({
          name: 'appInitiatedSSOToWeb',
        });
        await newContainer.configure({
          endpoint: endpoint,
          tokenStorage: new TransientTokenStorage(),
          isSSOEnabled: true,
          clientID: targetClientID,
          uiImplementation: uiImpl,
        });
        await newContainer.authenticate({
          redirectURI: redirectURI,
        });
        const userInfo = await newContainer.fetchUserInfo();
        showUser(userInfo);
      } else {
        // This willbe redirected to appInitiatedSSOToWebRedirectURI and never close,
        // so we do not await
        uiImpl
          .openAuthorizationURL({
            url: url,
            redirectURI: redirectURI,
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
  }, [authgear, appInitiatedSSOToWebRedirectURI, appInitiatedSSOToWebClientID]);

  const openSettings = useCallback(() => {
    authgear
      .open(Page.Settings, {
        colorScheme: colorScheme as ColorScheme,
        wechatRedirectURI,
      })
      .catch(err => showError(err));
  }, [showError, colorScheme]);

  const changePassword = useCallback(async () => {
    await authgear.refreshIDToken();
    authgear
      .changePassword({
        redirectURI: redirectURI,
        colorScheme: colorScheme as ColorScheme,
        wechatRedirectURI,
      })
      .catch(err => showError(err));
  }, [showError, colorScheme]);

  const fetchUserInfo = useCallback(() => {
    setLoading(true);
    authgear
      .fetchUserInfo()
      .then(userInfo => {
        setUserInfo(userInfo);
        showUser(userInfo);
      })
      .catch(e => showError(e))
      .finally(() => {
        setLoading(false);
      });
  }, [showError, showUser]);

  const showAuthTime = useCallback(() => {
    Alert.alert('auth_time', `${authgear.getAuthTime()}`);
  }, []);

  const logout = useCallback(() => {
    setLoading(true);
    authgear
      .logout()
      .then(() => {
        setUserInfo(null);
      })
      .catch(e => {
        showError(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [showError]);

  return (
    <ScrollView style={styles.root}>
      <View style={styles.configure}>
        <View style={styles.configureDesc}>
          <Text style={styles.configureDescText}>
            Enter Client ID and Endpoint, and then click Configure to initialize
            SDK
          </Text>
        </View>
        <View style={styles.input}>
          <Text style={styles.inputLabel}>Client ID</Text>
          <TextInput
            style={styles.inputField}
            value={clientID}
            onChangeText={setClientID}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Enter client ID"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.inputLabel}>Endpoint</Text>
          <TextInput
            style={styles.inputField}
            value={endpoint}
            onChangeText={setEndpoint}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Enter endpoint"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.inputLabel}>Authentication Flow Group</Text>
          <TextInput
            style={styles.inputField}
            value={authenticationFlowGroup}
            onChangeText={setAuthenticationflowGroup}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Enter flow group"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.inputLabel}>Page</Text>
          <RadioGroup
            style={styles.radioGroup}
            items={pageItems}
            value={page}
            onChange={setPage}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.inputLabel}>Color Scheme</Text>
          <RadioGroup
            style={styles.radioGroup}
            items={colorSchemeItems}
            value={explicitColorScheme}
            onChange={setExplicitColorScheme}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.inputLabel}>Use TransientTokenStorage</Text>
          <Switch
            style={styles.checkbox}
            value={useTransientTokenStorage}
            onValueChange={setUseTransientTokenStorage}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.inputLabel}>Is SSO Enabled</Text>
          <Switch
            style={styles.checkbox}
            value={isSSOEnabled}
            onValueChange={setIsSSOEnabled}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.inputLabel}>Use WebKit WebView</Text>
          <Switch
            style={styles.checkbox}
            value={useWebKitWebView}
            onValueChange={setUseWebKitWebView}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.inputLabel}>SessionState</Text>
          <Text style={styles.textValue}>{sessionState}</Text>
        </View>
        <View style={styles.input}>
          <Text style={styles.inputLabel}>
            Is App Initiated SSO To Web Enabled
          </Text>
          <Switch
            style={styles.checkbox}
            value={preAuthenticatedURLEnabled}
            onValueChange={setIsAppInitiatedSSOToWebEnabled}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.inputLabel}>
            App Initiated SSO To Web Client ID
          </Text>
          <TextInput
            style={styles.inputField}
            value={appInitiatedSSOToWebClientID}
            onChangeText={setAppInitiatedSSOToWebClientID}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Enter Client ID"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.inputLabel}>
            App Initiated SSO To Web Redirect URI
          </Text>
          <TextInput
            style={styles.inputField}
            value={appInitiatedSSOToWebRedirectURI}
            onChangeText={setAppInitiatedSSOToWebRedirectURI}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Enter Redirect URI"
          />
        </View>
        <View style={styles.configureAction}>
          <Button title="Configure" onPress={configure} disabled={loading} />
        </View>
      </View>
      <Text style={styles.actionDesc}>
        After that, remember to add redirect URI {redirectURI} to OAuth client
        through Authgear portal or editing authgear.yaml config file.{' '}
      </Text>
      <Text style={styles.actionDesc}>
        Click one of the following buttons to try different features.
      </Text>
      <View style={styles.actionButtons}>
        <View style={styles.button}>
          <Button
            title="Authenticate"
            onPress={login}
            disabled={!initialized || loading || loggedIn}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Authenticate Anonymously"
            onPress={loginAnonymously}
            disabled={!initialized || loading || loggedIn}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Promote Anonymous User"
            onPress={promoteAnonymousUser}
            disabled={
              !initialized ||
              loading ||
              !(userInfo?.isAnonymous ?? false) ||
              !loggedIn
            }
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Reauthenticate (web only)"
            onPress={reauthenticateWebOnly}
            disabled={!initialized || loading || !loggedIn}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Reauthenticate (biometric or web)"
            onPress={reauthenticate}
            disabled={!initialized || loading || !loggedIn}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Enable Biometric"
            onPress={enableBiometric}
            disabled={!initialized || loading || !loggedIn || biometricEnabled}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Disable Biometric"
            onPress={disableBiometric}
            disabled={!initialized || loading || !biometricEnabled}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Authenticate with biometric"
            onPress={authenticateBiometric}
            disabled={!initialized || loading || loggedIn || !biometricEnabled}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="App Initiated SSO To Web"
            onPress={startAppInitiatedSSOToWeb}
            disabled={
              !initialized ||
              loading ||
              !loggedIn ||
              !preAuthenticatedURLEnabled
            }
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Open Settings"
            onPress={openSettings}
            disabled={!initialized || !loggedIn}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Change Password"
            onPress={changePassword}
            disabled={!initialized || !loggedIn}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Fetch User Info"
            onPress={fetchUserInfo}
            disabled={!initialized || loading || !loggedIn}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Show auth_time"
            onPress={showAuthTime}
            disabled={!initialized || loading || !loggedIn}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Logout"
            onPress={logout}
            disabled={!initialized || loading || !loggedIn}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
