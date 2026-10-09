import { usePreferencesStore } from '@/stores/preferences.store';

describe('preferences store — welcome screen', () => {
  it('starts unseen and stays seen once marked', () => {
    expect(usePreferencesStore.getState().hasSeenWelcome).toBe(false);
    usePreferencesStore.getState().markWelcomeSeen();
    expect(usePreferencesStore.getState().hasSeenWelcome).toBe(true);
  });
});
