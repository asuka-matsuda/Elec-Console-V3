import { ref } from 'vue';
import type { ExamRow, ExamStatus } from '~/types/portal';
import { EXAM_STATUS, KAIRO_KIGOU_LIST } from '~/utils/constants/portal';

export const usePhaseData = (phase: 1 | 2 | 3) => {
  const isLoading = ref(false);
  const rows = ref<ExamRow[]>([]);
  const phaseTitle = phase === 1 ? 'Phase 1 試験' : phase === 2 ? 'Phase 2 試験' : 'Phase 3 試験';

  const fetchRows = async () => {
    isLoading.value = true;
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockRows: ExamRow[] = [];
    const statusList: ExamStatus[] = [EXAM_STATUS.NOT_STARTED, EXAM_STATUS.PASSED, EXAM_STATUS.FAILED];
    for (let i = 1; i <= 10; i++) {
      const base = {
        id: `phase${phase}_${i}`,
        kairo_kigou: KAIRO_KIGOU_LIST[i % KAIRO_KIGOU_LIST.length] as string,
        target: `分電盤 1F-${i}`,
        location: '1F 事務室',
        status: statusList[i % statusList.length] as ExamStatus,
        memo: i % 3 === 0 ? '要確認' : '',
        updated_at: new Date().toISOString(),
        worker_name: '山田 太郎'
      };
      
      if (phase === 2 || phase === 3) {
        mockRows.push({ ...base, result_value: undefined });
      } else {
        mockRows.push(base);
      }
    }
    rows.value = mockRows;
    isLoading.value = false;
  };

  const updateRowStatus = async (id: string, newStatus: ExamStatus) => {
    const target = rows.value.find(r => r.id === id);
    if (target) {
      target.status = newStatus;
      target.updated_at = new Date().toISOString();
    }
  };

  return { phaseTitle, rows, isLoading, fetchRows, updateRowStatus };
};
