import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {ScrollView, Text, StyleSheet, Button, View, Alert} from 'react-native';
import Config from 'react-native-config';
import authgear, {Page} from '@authgear/react-native';

import {ShowLoading} from '../ShowLoading';

const styles = StyleSheet.create({
  root: {
    backgroundColor: 'white',
    padding: 20,
    flexDirection: 'column',
  },
  container: {
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  fieldGroup: {
    width: '100%',
    marginBottom: 15,
  },
  field: {
    marginBottom: 8,
  },
  fieldTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#707070',
  },
  fieldText: {
    fontSize: 15,
    color: '#888888',
  },
});

const FALLBACK_TEXT = 'N/A';
const redirectURI = Config.AUTHGEAR_REDIRECT_URI;
const ANONYMOUS_USERS_DISABLED_ERROR = 'unauthorized_client';

const HomeScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const clientID = Config.AUTHGEAR_CLIENT_ID;
  const endpoint = Config.AUTHGEAR_ENDPOINT;
  const [accessToken, setAccessToken] = useState<string | undefined>(
    authgear.getAccessToken(),
  );
  const [isAnonymous, setIsAnonymous] = useState<boolean | undefined>();
  const [userID, setUserID] = useState<string | undefined>();

  useEffect(() => {
    if (accessToken != null) {
      authgear
        .fetchUserInfo()
        .then((userInfo) => {
          setIsAnonymous(userInfo.isAnonymous);
          setUserID(userInfo.sub);
        })
        .catch(() => {
          Alert.alert('Error', 'Failed to initialize screen state');
        });
    }
  }, []);

  const updateAccessToken = useCallback(() => {
    setAccessToken(authgear.getAccessToken());
  }, []);

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
        setUserID(userInfo.sub);
        updateAccessToken();
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
        setUserID(userInfo.sub);
        updateAccessToken();
        Alert.alert('Success', 'Logged in anonymously');
      })
      .catch((err) => {
        if (err.error === ANONYMOUS_USERS_DISABLED_ERROR) {
          Alert.alert('Error', 'Anonymous users are not allowed');
        } else {
          console.error(err);
          Alert.alert('Error', 'Failed to authenticate anonymously');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const openSettings = useCallback(() => {
    // FIXME: crash on Android
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
        setUserID(userInfo.sub);
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
  }, []);

  const fetchUserInfo = useCallback(() => {
    setLoading(true);
    authgear
      .fetchUserInfo()
      .then((userInfo) => {
        setIsAnonymous(userInfo.isAnonymous);
        setUserID(userInfo.sub);
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
        setUserID(undefined);
        updateAccessToken();
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
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.fieldGroup}>
        <View style={styles.field}>
          <Text style={styles.fieldTitle}>Client ID</Text>
          <Text style={styles.fieldText}>{clientID ?? FALLBACK_TEXT}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldTitle}>Endpoint</Text>
          <Text style={styles.fieldText}>{endpoint ?? FALLBACK_TEXT}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldTitle}>Is Anonymous</Text>
          <Text style={styles.fieldText}>
            {isAnonymous?.toString() ?? FALLBACK_TEXT}
          </Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldTitle}>User ID</Text>
          <Text style={styles.fieldText}>{userID ?? FALLBACK_TEXT}</Text>
        </View>
      </View>
      <ShowLoading loading={loading} />
      <View style={styles.button}>
        <Button
          title="Authenticate Anonymously"
          onPress={loginAnonymously}
          disabled={loggedIn}
        />
      </View>
      <View style={styles.button}>
        <Button title="Authorize" onPress={login} disabled={loggedIn} />
      </View>
      <View style={styles.button}>
        <Button title="Open Settings" onPress={openSettings} />
      </View>
      <View style={styles.button}>
        <Button
          title="Promote Anonymous User"
          onPress={promoteAnonymousUser}
          disabled={!isAnonymous || !loggedIn}
        />
      </View>
      <View style={styles.button}>
        <Button
          title="Fetch User Info"
          onPress={fetchUserInfo}
          disabled={!loggedIn}
        />
      </View>
      <View style={styles.button}>
        <Button title="Logout" onPress={logout} disabled={!loggedIn} />
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
