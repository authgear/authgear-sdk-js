import React from 'react';
import {View, Modal, ActivityIndicator, Text, StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  background: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  'loading-whell-container': {
    transform: [{scale: 1.5}],
  },
  'loading-text-container': {
    marginTop: 30,
  },
  'loading-text': {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f0f0f0',
  },
});

export const LoadingModal: React.FC<{loading: boolean}> = (props) => {
  const {loading} = props;

  return (
    <Modal visible={loading} transparent={true}>
      <View style={styles.background}>
        <View style={styles['loading-whell-container']}>
          <ActivityIndicator size="large" color={'#f0f0f0'} />
        </View>
        <View style={styles['loading-text-container']}>
          <Text style={styles['loading-text']}>Loading...</Text>
        </View>
      </View>
    </Modal>
  );
};
