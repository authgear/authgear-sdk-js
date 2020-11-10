import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  root: {
    marginVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  'loading-text-container': {
    marginTop: 20,
  },
  'loading-text': {
    fontSize: 15,
    color: '#555555',
  },
});

interface ShowLoadingProps {
  loading: boolean;
}

export const ShowLoading: React.FC<ShowLoadingProps> = (props) => {
  const {loading} = props;

  return (
    <View style={{display: loading ? 'flex' : 'none', ...styles.root}}>
      <View>
        <ActivityIndicator size="large" color={'#555555'} />
      </View>
      <View style={styles['loading-text-container']}>
        <Text style={styles['loading-text']}>Loading...</Text>
      </View>
    </View>
  );
};
