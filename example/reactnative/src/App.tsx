import React, {useState, useEffect} from 'react';
import {SafeAreaView, StatusBar, Alert} from 'react-native';
import Config from 'react-native-config';
import authgear from '@authgear/react-native';

import MainScreen from './screens/MainScreen';
import {LoadingModal} from './LoadingModal';

const clientID = Config.AUTHGEAR_CLIENT_ID;
const endpoint = Config.AUTHGEAR_ENDPOINT;

const App: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    authgear
      .configure({
        clientID,
        endpoint,
      })
      .then(() => {
        setInitialized(true);
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to configure Authgear container');
      });
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView>
        {initialized ? <MainScreen /> : <LoadingModal loading={true} />}
      </SafeAreaView>
    </>
  );
};

export default App;
