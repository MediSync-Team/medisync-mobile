import { TouchableOpacity, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, spacing, fontSize } from '../theme';

type Props = {
  title: string;
  subtitle?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export function VideoCallAction({ title, subtitle, onPress, variant = 'primary' }: Props) {
  const { colors } = useTheme();

  const backgroundColor = variant === 'primary' ? colors.primary : colors.surface;
  const borderColor = variant === 'primary' ? colors.primary : colors.border;
  const textColor = variant === 'primary' ? colors.white : colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        backgroundColor,
        borderWidth: 1,
        borderColor,
      }}
    >
      <View style={{ gap: 2 }}>
        <Text style={{ color: textColor, fontWeight: '700', fontSize: fontSize.md }}>{title}</Text>
        {subtitle ? <Text style={{ color: textColor, opacity: 0.9, fontSize: fontSize.xs }}>{subtitle}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}
