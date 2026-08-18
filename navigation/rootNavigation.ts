import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';

/** Navigate to a root stack screen from a nested tab navigator. */
export function navigateRoot(
  navigation: NavigationProp<ParamListBase>,
  routeName: keyof RootStackParamList,
) {
  let nav: NavigationProp<ParamListBase> | undefined = navigation;
  while (nav) {
    const names = nav.getState()?.routeNames ?? [];
    if (names.includes(routeName)) {
      nav.navigate(routeName as never);
      return;
    }
    nav = nav.getParent() as NavigationProp<ParamListBase> | undefined;
  }
  navigation.navigate(routeName as never);
}
