// Metro/Node require is available at runtime but may not be in the TS lib.
declare const require: ((id: string) => unknown) | undefined;

/**
 * Lumina — GradientText
 *
 * Renders text with the signature luminous gradient applied via a MaskedView
 * approach: render the text normally, then overlay a LinearGradient clipped
 * to the text shape using @react-native-masked-view (if available) or fall
 * back to solid accent text.
 *
 * Because @react-native-masked-view is an optional dependency not in the
 * base package.json, we attempt a require and gracefully degrade. Screens
 * that need the gradient effect should ensure masked-view is installed.
 *
 * For guaranteed gradient effect, use the gradient variant on Button instead.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme';
import { Text, type TextProps } from './Text';

// ---------------------------------------------------------------------------
// Attempt to load masked view
// ---------------------------------------------------------------------------

type MaskedViewStatic = {
  default: React.ComponentType<{
    maskElement: React.ReactNode;
    style?: object;
    children: React.ReactNode;
  }>;
};

let MaskedView: MaskedViewStatic['default'] | null = null;

try {
  // Metro bundler resolves require() at build time.
  if (typeof require === 'function') {
    const mod = (require as (id: string) => MaskedViewStatic)(
      '@react-native-masked-view/masked-view',
    );
    MaskedView = mod.default ?? null;
  }
} catch {
  // Graceful fallback — solid accent text rendered below
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GradientTextProps = Omit<TextProps, 'color'>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GradientText({ style, children, ...rest }: GradientTextProps): React.JSX.Element {
  const theme = useTheme();

  if (MaskedView === null) {
    // Fallback: render with solid accent color
    return (
      <Text color="accent" style={style} {...rest}>
        {children}
      </Text>
    );
  }

  const Masked = MaskedView;

  return (
    <Masked
      style={styles.container}
      maskElement={
        <Text style={[style, { backgroundColor: 'transparent' }]} {...rest}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={theme.colors.accentGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />
    </Masked>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  gradient: {
    flex: 1,
  },
});
