import { KidAlert } from '../services/kidAlert';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function promptPremiumSubscribe(
  navigation: Nav,
  title = 'Premium content',
  message = 'Subscribe to unlock this video or channel for your family.',
) {
  KidAlert.alert(title, message, [
    { text: 'Not now', style: 'cancel' },
    { text: 'View plans', onPress: () => navigation.navigate('Subscription') },
  ]);
}
