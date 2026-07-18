/**
 * Lumina — RichCaption
 *
 * Renders caption/comment text with tappable #hashtags and @mentions
 * highlighted in the accent color. Pure presentation; navigation is
 * delegated to the callbacks so this stays screen-agnostic.
 */

import React, { memo, useMemo } from 'react';

import { Text, type TextProps } from '@/design-system/primitives/Text';
import { useTheme } from '@/design-system/theme';
import { parseRichText } from '@/utils/richText';

export interface RichCaptionProps
  extends Omit<TextProps, 'children' | 'onPress'> {
  text: string;
  onHashtagPress?: (tag: string) => void;
  onMentionPress?: (username: string) => void;
}

function RichCaptionBase({
  text,
  onHashtagPress,
  onMentionPress,
  ...textProps
}: RichCaptionProps): React.JSX.Element {
  const theme = useTheme();
  const segments = useMemo(() => parseRichText(text), [text]);

  return (
    <Text {...textProps}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <Text key={i} {...textProps}>{seg.value}</Text>;
        }
        const isTag = seg.type === 'hashtag';
        const handler = isTag ? onHashtagPress : onMentionPress;
        return (
          <Text
            key={i}
            {...textProps}
            style={[textProps.style, { color: theme.colors.accent }]}
            onPress={handler ? () => handler(seg.value) : undefined}
            accessibilityRole={handler ? 'link' : undefined}
          >
            {isTag ? `#${seg.value}` : `@${seg.value}`}
          </Text>
        );
      })}
    </Text>
  );
}

export const RichCaption = memo(RichCaptionBase);
