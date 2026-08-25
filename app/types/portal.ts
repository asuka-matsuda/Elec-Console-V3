export type ExamStatus = '未実施' | '合格' | '不良' | '手直し完了' | '除外';

export interface ExamRowBase {
  id: string;
  kairo_kigou: string;
  target: string;
  location: string;
  status: ExamStatus;
  memo?: string;
  updated_at?: string;
  worker_name?: string;
}

export interface ExamRowPhase1 extends ExamRowBase {}

export interface ExamRowPhase23 extends ExamRowBase {
  result_value?: number;
}

export type ExamRow = ExamRowPhase1 | ExamRowPhase23;
