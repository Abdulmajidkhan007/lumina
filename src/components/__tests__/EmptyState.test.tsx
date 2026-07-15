import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { EmptyState } from '@/components/EmptyState';
import { ThemeProvider } from '@/design-system/theme';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider forcedScheme="light">{ui}</ThemeProvider>);
}

describe('EmptyState', () => {
  it('renders the title and subtitle', () => {
    renderWithTheme(
      <EmptyState title="No posts yet" subtitle="Share your first photo." />,
    );

    expect(screen.getByText('No posts yet')).toBeTruthy();
    expect(screen.getByText('Share your first photo.')).toBeTruthy();
  });

  it('does not render a subtitle node when none is provided', () => {
    renderWithTheme(<EmptyState title="No posts yet" />);

    expect(screen.getByText('No posts yet')).toBeTruthy();
    expect(screen.queryByText('Share your first photo.')).toBeNull();
  });

  it('fires the action onPress handler when the button is pressed', () => {
    const onPress = jest.fn();
    renderWithTheme(
      <EmptyState
        title="No posts yet"
        action={{ label: 'Create post', onPress }}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Create post' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders no action button when none is provided', () => {
    renderWithTheme(<EmptyState title="No posts yet" />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});
