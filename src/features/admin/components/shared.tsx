/** Loading / error wrappers used by every admin tab. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/design-system/primitives/Spinner';
import { ErrorState } from '@/components/ErrorState';

export function TabLoading(): React.JSX.Element {
  return (
    <View style={styles.center}>
      <Spinner size="md" />
    </View>
  );
}

export function TabError({ error, onRetry }: { error: Error | null; onRetry: () => void }): React.JSX.Element {
  const { t } = useTranslation('admin');
  return <ErrorState message={error?.message ?? t('common.loadFailed')} onRetry={onRetry} />;
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** Short "Oct 11" label for a UTC "YYYY-MM-DD" day. */
export function formatDayLabel(day: string, locale: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
