import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../../theme';
import { useLang } from '../../i18n/context';

export default function AgendaScreen() {
  const { t } = useLang();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('professional', 'agenda')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
});
