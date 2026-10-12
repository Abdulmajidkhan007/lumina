/**
 * Lumina — MuteButton
 *
 * Round speaker toggle bound to the global `videoMuted` preference — the
 * same switch for Reels and feed videos.
 */

import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { hitSlop } from '@/constants/layout';
import { useToggleVideoMuted, useVideoMuted } from '@/stores/preferences.store';

const BG = 'rgba(0,0,0,0.5)';
const ICON = '#FFFFFF';

export interface MuteButtonProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function MuteButton({ size = 32, style }: MuteButtonProps): React.JSX.Element {
  const { t } = useTranslation();
  const muted = useVideoMuted();
  const toggle = useToggleVideoMuted();
  return (
    <Pressable
      onPress={toggle}
      hitSlop={hitSlop.md}
      accessibilityRole="button"
      accessibilityLabel={muted ? t('video.unmute') : t('video.mute')}
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: BG },
        style,
      ]}
    >
      <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={size * 0.55} color={ICON} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
