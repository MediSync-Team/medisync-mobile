import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, borderRadius, fontSize } from '../theme';

interface Segment {
  key: string;
  label: string;
  badge?: number;
}

interface SegmentedControlProps {
  segments: Segment[];
  selected: string;
  onSelect: (key: string) => void;
}

export default function SegmentedControl({ segments, selected, onSelect }: SegmentedControlProps) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {segments.map((seg) => {
        const isActive = seg.key === selected;
        return (
          <TouchableOpacity
            key={seg.key}
            onPress={() => onSelect(seg.key)}
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.xs,
              borderRadius: borderRadius.md,
              backgroundColor: isActive ? colors.primary + '18' : colors.surface,
              borderWidth: 1,
              borderColor: isActive ? colors.primary : colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.xs,
            }}
          >
            <Text
              style={{
                color: isActive ? colors.primary : colors.text,
                textAlign: 'center',
                fontWeight: '700',
                fontSize: fontSize.xs,
              }}
            >
              {seg.label}
            </Text>
            {seg.badge != null && seg.badge > 0 ? (
              <View
                style={{
                  backgroundColor: isActive ? colors.primary : colors.muted,
                  borderRadius: borderRadius.full,
                  paddingHorizontal: spacing.xs + 2,
                  paddingVertical: 1,
                }}
              >
                <Text
                  style={{
                    color: isActive ? colors.white : colors.textSecondary,
                    fontSize: fontSize.xs - 2,
                    fontWeight: '700',
                  }}
                >
                  {seg.badge > 99 ? '99+' : seg.badge}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
