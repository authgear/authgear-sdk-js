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
} from '@authgear/react-native';

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

const biometricOptions = {
  ios: {
    localizedReason: 'Use biometric to authenticate',
    constraint: 'biometryCurrentSet' as const,
  },
  android: {
    title: 'Biometric Authentication',
    subtitle: 'Biometric authentication',
    description: 'Use biometric to authenticate',
    negativeButtonText: 'Cancel',
    constraint: ['BIOMETRIC_STRONG' as const],
    invalidatedByBiometricEnrollment: true,
  },
};

const HomeScreen: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientID, setClientID] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [page, setPage] = useState('');
  const [useTransientTokenStorage, setUseTransientTokenStorage] =
    useState(false);
  const [shareSessionWithSystemBrowser, setShareSessionWithSystemBrowser] =
    useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const loggedIn = userInfo != null;

  const showUser = useCallback((userInfo: UserInfo) => {
    Alert.alert(
      'User Info',
      [
        `User ID: ${userInfo.sub}`,
        `Is Anonymous: ${userInfo.isAnonymous}`,
        `Is Verified: ${userInfo.isVerified}`,
      ].join('\n'),
    );
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
  }, [showError]);

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
        shareSessionWithSystemBrowser,
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
    shareSessionWithSystemBrowser,
    postConfigure,
    showError,
  ]);

  const login = useCallback(() => {
    setLoading(true);
    authgear
      .authorize({
        redirectURI,
        wechatRedirectURI,
        page,
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
  }, [page, updateBiometricState, showError, showUser]);

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
  }, [showError, showUser, updateBiometricState]);

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
          wechatRedirectURI,
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
  }, [showError, showUser]);

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
        wechatRedirectURI,
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
  }, [showError, showUser]);

  const enableBiometric = useCallback(async () => {
    setLoading(true);
    try {
      await authgear.checkBiometricSupported(biometricOptions);
      await authgear.enableBiometric(biometricOptions);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
      updateBiometricState();
    }
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

  const openSettings = useCallback(() => {
    authgear
      .open(Page.Settings, {
        wechatRedirectURI,
      })
      .catch(err => showError(err));
  }, [showError]);

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
            autoCompleteType="off"
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
            autoCompleteType="off"
            autoCorrect={false}
            placeholder="Enter endpoint"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.inputLabel}>Page</Text>
          <TextInput
            style={styles.inputField}
            onChangeText={setPage}
            autoCapitalize="none"
            autoCompleteType="off"
            autoCorrect={false}
            placeholder="'login' or 'signup'"
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
          <Text style={styles.inputLabel}>
            Share Session With Device Browser
          </Text>
          <Switch
            style={styles.checkbox}
            value={shareSessionWithSystemBrowser}
            onValueChange={setShareSessionWithSystemBrowser}
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
            title="Open Settings"
            onPress={openSettings}
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
