import React, {useState, useCallback} from 'react';
import {ScrollView, Text, StyleSheet, Button, View} from 'react-native';
import Config from 'react-native-config';
import authgear from '@authgear/react-native';

import {LoadingModal} from '../LoadingModal';

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

const HomeScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const clientID = Config.AUTHGEAR_CLIENT_ID;
  const endpoint = Config.AUTHGEAR_ENDPOINT;
  const [isAnonymous, setIsAnonymous] = useState<boolean | undefined>();
  const [userID, setUserID] = useState<string | undefined>();

  const loggedIn = useMemo(() => {
    return userID != null;
  }, [userID]);

  const login = useCallback(() => {
    // TODO: to be implemented
  }, []);

  const loginAnonymously = useCallback(() => {
    // TODO: to be implemented
  }, []);

  const openSettings = useCallback(() => {
    // TODO: to be implemented
  }, []);

  const promoteAnonymousUser = useCallback(() => {
    // TODO: to be implemented
  }, []);

  const fetchUserInfo = useCallback(() => {
    // TODO: to be implemented
  }, []);

  const logout = useCallback(() => {
    // TODO: to be implemented
  }, []);

  return (
    <>
      <LoadingModal loading={loading} />
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
    </>
  );
};

export default HomeScreen;
