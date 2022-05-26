import React, {useCallback} from 'react';
import {
  View,
  Text,
  StyleProp,
  ViewStyle,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export interface RadioGroupItemProps<T> {
  label: string;
  value: T;
}

export interface RadioGroupProps<T> {
  style?: StyleProp<ViewStyle>;
  items: RadioGroupItemProps<T>[];
  value: T;
  onChange: (newValue: T) => void;
}

interface RadioButtonProps<T> {
  value: T;
  label: string;
  selected: boolean;
  onPress: (value: T) => void;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'column',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  bigDot: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    width: 24,
    height: 24,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallDot: {
    borderRadius: 6,
    borderWidth: 6,
    borderColor: '#007AFF',
    width: 6,
    height: 6,
  },
});

function RadioButton<T>(props: RadioButtonProps<T>) {
  const {value, label, selected, onPress: onPressProp} = props;
  const onPress = useCallback(() => {
    onPressProp(value);
  }, [value, onPressProp]);
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={styles.bigDot}>
        {selected && <View style={styles.smallDot} />}
      </View>
      <Text>{label}</Text>
    </TouchableOpacity>
  );
}

export default function RadioGroup<T>(props: RadioGroupProps<T>) {
  const {style, items, value: selectedValue, onChange} = props;
  return (
    <View style={[styles.root, style]}>
      {items.map(item => {
        const {value, label} = item;
        return (
          <RadioButton
            key={String(value)}
            value={value}
            label={label}
            selected={selectedValue === value}
            onPress={onChange}
          />
        );
      })}
    </View>
  );
}
