import { View, type DimensionValue } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SkeletonProps = {
  width: DimensionValue;
  height: number;
};

/** Grey placeholder that holds the space of content that's still loading. */
export function Skeleton({ width, height }: SkeletonProps) {
  const colors = useTheme();

  return (
    <View
      accessibilityLabel="Loading"
      style={{ width, height, borderRadius: Radius.sm, backgroundColor: colors.border }}
    />
  );
}
