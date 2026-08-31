import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useHeaderHeight() {
  const insets = useSafeAreaInsets();
  return {
    insets,
    headerPaddingTop: insets.top + 12,
    headerHeight: insets.top + 64,
    scrollPaddingTop: insets.top + 76,
  };
}
