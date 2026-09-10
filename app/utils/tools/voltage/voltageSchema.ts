import { z } from 'zod'

export const voltageSchema = z
  .object({
    mode: z.enum(['drop', 'size']),
    phase: z.string().min(1, '配電方式を選択してください'),
    loadValue: z
      .number({
        required_error: '必須です',
        invalid_type_error: '数値を入力してください',
      })
      .nullable()
      .refine(val => val !== null && val > 0, {
        message: '0より大きい数値を入力してください',
      }),
    loadUnit: z.string(),
    powerFactor: z.string().optional(),
    distance: z
      .number({
        required_error: '必須です',
        invalid_type_error: '数値を入力してください',
      })
      .nullable()
      .refine(val => val !== null && val > 0, {
        message: '0より大きい数値を入力してください',
      }),
    category: z.string().min(1, 'ケーブル種別を選択してください'),
    cores: z.string().optional(),
    cableIdx: z.string().optional(),
    parallel: z.string().optional(),
    derating: z.string().min(1, '布設条件（電流減少係数）を選択してください'),
    ambientTemp: z.string().optional(),
    targetDrop: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'drop' && !data.cableIdx) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'サイズを指定してください',
        path: ['cableIdx'],
      })
    }
    if (data.mode === 'size' && !data.targetDrop) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '目標降下率を指定してください',
        path: ['targetDrop'],
      })
    }
  })
