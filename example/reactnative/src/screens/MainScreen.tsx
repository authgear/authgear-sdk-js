import React, {useState, useCallback, useMemo} from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  Button,
  View,
  Alert,
  TextInput,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import Config from 'react-native-config';
import authgear, {Page} from '@authgear/react-native';

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
  },
  inputLabel: {
    fontWeight: '600',
    color: '#707070',
    fontSize: 15,
    width: 80,
  },
  inputField: {
    width: 200,
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
  safariCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  safariCheckboxDesc: {
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

const redirectURI = Config.AUTHGEAR_REDIRECT_URI;
const ANONYMOUS_USERS_DISABLED_ERROR = 'unauthorized_client';

const HomeScreen: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const [prefersSFSafariVC, setPrefersSFSafariVC] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientID, setClientID] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [accessToken, setAccessToken] = useState<string | undefined>(
    authgear.getAccessToken(),
  );
  const [isAnonymous, setIsAnonymous] = useState<boolean | undefined>();

  const updateAccessToken = useCallback(() => {
    setAccessToken(authgear.getAccessToken());
  }, []);

  const postConfigure = useCallback(() => {
    updateAccessToken();
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
  }, [updateAccessToken]);

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

  // TODO: use on session state change after implementation is merged
  const loggedIn = useMemo(() => {
    return accessToken != null;
  }, [accessToken]);

  const login = useCallback(() => {
    setLoading(true);
    authgear
      .authorize({
        redirectURI,
      })
      .then(({userInfo}) => {
        setIsAnonymous(userInfo.isAnonymous);
        updateAccessToken();
        Alert.alert('Success', 'Logged in successfully');
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to authorize');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [updateAccessToken]);

  const loginAnonymously = useCallback(() => {
    setLoading(true);
    authgear
      .authenticateAnonymously()
      .then(({userInfo}) => {
        setIsAnonymous(userInfo.isAnonymous);
        updateAccessToken();
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
  }, [updateAccessToken]);

  const openSettings = useCallback(() => {
    authgear
      .open(Page.Settings)
      .catch(() => Alert.alert('Error', 'Failed to open setting page'));
  }, []);

  const promoteAnonymousUser = useCallback(() => {
    setLoading(true);
    authgear
      .promoteAnonymousUser({
        redirectURI,
      })
      .then(({userInfo}) => {
        setIsAnonymous(userInfo.isAnonymous);
        updateAccessToken();
        Alert.alert(
          'Success',
          'Successfully promoted to normal authenticated user',
        );
      })
      .catch(() => Alert.alert('Error', 'Failed to promote anonymous user'))
      .finally(() => {
        setLoading(false);
      });
  }, [updateAccessToken]);

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
        updateAccessToken();
        Alert.alert('Success', 'Logged out successfully');
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to logout');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [updateAccessToken]);

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
          <TextInput style={styles.inputField} onChangeText={setClientID} />
        </View>
        <View style={styles.input}>
          <Text style={styles.inputLabel}>Endpoint</Text>
          <TextInput style={styles.inputField} onChangeText={setEndpoint} />
        </View>
        <View style={styles.configureAction}>
          <Button title="Configure" onPress={configure} disabled={loading} />
          <View style={styles.safariCheckboxContainer}>
            <Text style={styles.safariCheckboxDesc}>
              Prefer Safari VC (iOS only)
            </Text>
            {/* TODO: use prefersSFSafariViewController option in configure
                      after PR is merged */}
            <CheckBox
              style={styles.checkbox}
              boxType="square"
              disabled={true}
              value={prefersSFSafariVC}
              onValueChange={setPrefersSFSafariVC}
            />
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
            disabled={!initialized || loggedIn}
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
