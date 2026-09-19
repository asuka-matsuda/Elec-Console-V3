import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { useFormValidation } from '../../app/composables/useFormValidation'

describe('useFormValidation', () => {
  it('should validate required string fields and report errors', () => {
    const form = ref({
      title: '',
      date: '2026-09-19',
      desc: '',
    })

    const { fieldErrors, validate } = useFormValidation(form, {
      title: 'タイトル',
      date: '日付',
    })

    const isValid = validate()

    expect(isValid).toBe(false)
    expect(fieldErrors.value.title).toBe('タイトルは必須です。')
    expect(fieldErrors.value.date).toBeUndefined()
  })

  it('should treat whitespace-only strings as invalid', () => {
    const form = ref({
      title: '   ',
      date: '2026-09-19',
    })

    const { fieldErrors, validate } = useFormValidation(form, {
      title: 'タイトル',
    })

    const isValid = validate()

    expect(isValid).toBe(false)
    expect(fieldErrors.value.title).toBe('タイトルは必須です。')
  })

  it('should pass validation when all required fields have values', () => {
    const form = ref({
      title: 'お知らせ件名',
      date: '2026-09-19',
      desc: '',
    })

    const { fieldErrors, validate } = useFormValidation(form, {
      title: 'タイトル',
      date: '日付',
    })

    const isValid = validate()

    expect(isValid).toBe(true)
    expect(Object.keys(fieldErrors.value).length).toBe(0)
  })

  it('should reset errors with resetErrors', () => {
    const form = ref({
      title: '',
      date: '',
    })

    const { fieldErrors, validate, resetErrors } = useFormValidation(form, {
      title: 'タイトル',
      date: '日付',
    })

    validate()
    expect(fieldErrors.value.title).toBe('タイトルは必須です。')

    resetErrors()
    expect(Object.keys(fieldErrors.value).length).toBe(0)
  })

  it('should allow setting custom field error with setFieldError', () => {
    const form = ref({
      title: '有効なタイトル',
    })

    const { fieldErrors, setFieldError } = useFormValidation(form, {
      title: 'タイトル',
    })

    setFieldError('title', 'このタイトルは既に登録されています。')
    expect(fieldErrors.value.title).toBe('このタイトルは既に登録されています。')
  })
})
