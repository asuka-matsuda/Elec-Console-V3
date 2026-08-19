export interface HistoryEntry {
  id: string;
  toolName: string;
  timestamp: string;
  status: 'success' | 'error' | 'warning';
  mainResultText: string;
  inputs: { label: string; value: string }[];
  results: { label: string; value: string; isMain?: boolean; color?: string }[];
}
