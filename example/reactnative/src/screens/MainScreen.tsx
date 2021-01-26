import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  Button,
  View,
  Alert,
  TextInput,
  Switch,
  Platform,
  NativeModules,
} from 'react-native';
import authgear, {
  Page,
  ContainerDelegate,
  BaseContainer,
  BaseAPIClient,
  SessionStateChangeReason,
} from '@authgear/react-native';

import {ShowLoading} from '../ShowLoading';

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
    width: 80,
  },
  inputField: {
    width: 200,
    paddingBottom: 5,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderColor: '#888888',
    fontSize: 16,
  },
  configureAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
const weChatRedirectURI = Platform.select<string>({
  android: 'com.authgear.example.rn://host/open_wechat_app',
  ios: 'https://authgear-demo-rn.pandawork.com/authgear/open_wechat_app',
});

const ANONYMOUS_USERS_DISABLED_ERROR = 'unauthorized_client';

const HomeScreen: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const [isThirdParty, setIsThirdParty] = useState(true);
  const [loading, setLoading] = useState(false);
  const [clientID, setClientID] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [isAnonymous, setIsAnonymous] = useState<boolean | undefined>();

  const delegate: ContainerDelegate = useMemo(() => {
    const d: ContainerDelegate = {
      onSessionStateChange: (
        container: BaseContainer<BaseAPIClient>,
        _reason: SessionStateChangeReason,
      ) => {
        setLoggedIn(container.sessionState === 'AUTHENTICATED');
      },
      sendWeChatAuthRequest: (state) => {
        console.log('user click login with wechat, open wechat sdk');
        const {WeChatAuth} = NativeModules;
        WeChatAuth.sendWeChatAuthRequest(state)
          .then((result: {code: string; state: string}) => {
            console.log('sending wechat auth callback');
            return authgear.weChatAuthCallback(result.code, result.state);
          })
          .then(() => {
            console.log('send wechat auth callback successfully');
          })
          .catch((err: Error) => {
            console.error('failed to login with WeChat', err);
          });
      },
    };
    return d;
  }, []);

  useEffect(() => {
    authgear.delegate = delegate;

    return () => {
      authgear.delegate = undefined;
    };
  }, [delegate]);

  const postConfigure = useCallback(() => {
    if (authgear.getAccessToken() == null) {
      setInitialized(true);
      return;
    }
    authgear
      .fetchUserInfo()
      .then((userInfo) => {
        setIsAnonymous(userInfo.isAnonymous);
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to fetch user info');
      })
      .finally(() => {
        setInitialized(true);
      });
  }, []);

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
        isThirdParty,
      })
      .then(() => {
        postConfigure();
        Alert.alert('Success', 'Configured Authgear container successfully');
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to configure Authgear container');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clientID, endpoint, postConfigure]);

  const login = useCallback(() => {
    setLoading(true);
    authgear
      .authorize({
        redirectURI,
        weChatRedirectURI,
      })
      .then(({userInfo}) => {
        setIsAnonymous(userInfo.isAnonymous);
        Alert.alert('Success', 'Logged in successfully');
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to authorize');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const loginAnonymously = useCallback(() => {
    setLoading(true);
    authgear
      .authenticateAnonymously()
      .then(({userInfo}) => {
        setIsAnonymous(userInfo.isAnonymous);
        Alert.alert('Success', 'Logged in anonymously');
      })
      .catch((err) => {
        if (err.error === ANONYMOUS_USERS_DISABLED_ERROR) {
          Alert.alert('Error', 'Anonymous users are not allowed');
        } else {
          Alert.alert('Error', 'Failed to authenticate anonymously');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const openSettings = useCallback(() => {
    authgear
      .open(Page.Settings, {
        weChatRedirectURI,
      })
      .catch((err) => Alert.alert('Error', 'Failed to open setting page'));
  }, []);

  const promoteAnonymousUser = useCallback(() => {
    setLoading(true);
    authgear
      .promoteAnonymousUser({
        redirectURI,
        weChatRedirectURI,
      })
      .then(({userInfo}) => {
        setIsAnonymous(userInfo.isAnonymous);
        Alert.alert(
          'Success',
          'Successfully promoted to normal authenticated user',
        );
      })
      .catch(() => Alert.alert('Error', 'Failed to promote anonymous user'))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const fetchUserInfo = useCallback(() => {
    setLoading(true);
    authgear
      .fetchUserInfo()
      .then((userInfo) => {
        setIsAnonymous(userInfo.isAnonymous);
        Alert.alert(
          'Success',
          [
            'Fetched user info successfully',
            '',
            `User ID: ${userInfo.sub}`,
            `Is Anonymous: ${userInfo.isAnonymous}`,
            `Is Verified: ${userInfo.isVerified}`,
          ].join('\n'),
        );
      })
      .catch(() => Alert.alert('Error', 'Failed to fetch user info'))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const logout = useCallback(() => {
    setLoading(true);
    authgear
      .logout()
      .then(() => {
        setIsAnonymous(undefined);
        Alert.alert('Success', 'Logged out successfully');
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to logout');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
          <TextInput style={styles.inputField} onChangeText={setClientID} autoCapitalize="none" autoCompleteType="off" autoCorrect={false} />
        </View>
        <View style={styles.input}>
          <Text style={styles.inputLabel}>Endpoint</Text>
          <TextInput style={styles.inputField} onChangeText={setEndpoint} autoCapitalize="none" autoCompleteType="off" autoCorrect={false} />
        </View>
        <View style={styles.configureAction}>
          <Button title="Configure" onPress={configure} disabled={loading} />
        <View style={styles.optionsContainer}>
          <View style={styles.checkboxContainer}>
            <Text style={styles.checkboxDesc}>
              Third-party app
            </Text>
            <Switch
              style={styles.checkbox}
              value={isThirdParty}
              onValueChange={setIsThirdParty}
            />
          </View>
          </View>
        </View>
      </View>
      <ShowLoading loading={loading} />
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
            title="Authenticate Anonymously"
            onPress={loginAnonymously}
            disabled={!initialized || loggedIn || isThirdParty}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Authorize"
            onPress={login}
            disabled={!initialized || loggedIn}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Open Settings"
            onPress={openSettings}
            disabled={!initialized}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Promote Anonymous User"
            onPress={promoteAnonymousUser}
            disabled={!initialized || !isAnonymous || !loggedIn}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Fetch User Info"
            onPress={fetchUserInfo}
            disabled={!initialized || !loggedIn}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Logout"
            onPress={logout}
            disabled={!initialized || !loggedIn}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
