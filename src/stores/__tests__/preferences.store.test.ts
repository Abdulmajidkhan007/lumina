import { usePreferencesStore } from '@/stores/preferences.store';

describe('preferences store — welcome screen', () => {
  it('starts unseen and stays seen once marked', () => {
    expect(usePreferencesStore.getState().hasSeenWelcome).toBe(false);
    usePreferencesStore.getState().markWelcomeSeen();
    expect(usePreferencesStore.getState().hasSeenWelcome).toBe(true);
  });
});

describe('preferences store — global video sound', () => {
  it('starts with sound on and toggles for every player at once', () => {
    expect(usePreferencesStore.getState().videoMuted).toBe(false);
    usePreferencesStore.getState().toggleVideoMuted();
    expect(usePreferencesStore.getState().videoMuted).toBe(true);
    usePreferencesStore.getState().setVideoMuted(false);
    expect(usePreferencesStore.getState().videoMuted).toBe(false);
  });
});
