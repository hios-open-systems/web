/** Shared channel identity: use these colors for traces and their legends. */
export const SCOPE_COLORS = ['#00e5ff', '#ffab00', '#00ff66', '#d59bff'] as const;

export interface ScopeChannel {
  id: string;
  label: string;
  color: string;
}
