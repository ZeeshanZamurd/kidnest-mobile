import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

type Props = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
};

export default function SecureTextInput({ style, containerStyle, editable = true, ...props }: Props) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.wrap, containerStyle]}>
      <TextInput
        {...props}
        editable={editable}
        secureTextEntry={!visible}
        style={[styles.input, style, { paddingRight: 48 }]}
      />
      <Pressable
        style={styles.eyeBtn}
        onPress={() => setVisible((v) => !v)}
        disabled={!editable}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      >
        <Icon
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color={editable ? colors.textSecondary : colors.border}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
