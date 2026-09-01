export interface HistoryEntry<TInputs = Record<string, unknown>, TResults = Record<string, unknown>> {
  id: string
  toolId?: string
  toolName: string
  mode?: string
  timestamp: string
  status: 'success' | 'error' | 'warning'
  mainResultText: string
  inputs: { label: string, value: string }[]
  results: { label: string, value: string, isMain?: boolean, color?: string }[]
  rawInputs?: TInputs
  rawResult?: TResults
}
