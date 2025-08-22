import React from 'react';
import {View, StatusBar} from 'react-native';

import MainScreen from './screens/MainScreen';

const safeAreaStyle = {
  paddingHorizontal: '5%',
  paddingVertical: '5%',
};

const App: React.FC = () => {
  return (
    <>
      <StatusBar barStyle="light-content" />
      {/* @ts-expect-error */}
      <View style={safeAreaStyle}>
        <MainScreen />
      </View>
    </>
  );
};

export default App;
