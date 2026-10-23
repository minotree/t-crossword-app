export interface BackNavigationState {
  pending: boolean;
  answerOpen: boolean;
  page: 'home' | 'quiz' | 'words' | 'books' | 'settings';
}
export interface BackNavigationActions {
  closeAnswer(): void;
  closeBook(): boolean;
  goHome(): void;
  exit(): Promise<void>;
}

export async function navigateBack(state: BackNavigationState, actions: BackNavigationActions): Promise<void> {
  if (state.pending) return;
  if (state.answerOpen) { actions.closeAnswer(); return; }
  if (state.page === 'books' && actions.closeBook()) return;
  if (state.page !== 'home') { actions.goHome(); return; }
  await actions.exit();
}
