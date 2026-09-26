/**
 * Vue Provide / Inject 用 InjectionKey 定数定義
 *
 * コンポーネント間でのコンテキスト共有に使用する Symbol キーを一元管理します。
 */

import type { InjectionKey } from 'vue'

import type { FormGroupContext } from '~/types/components'

/**
 * FormGroup コンポーネントのラベル・エラー・ID状態共有キー
 */
export const FORM_GROUP_KEY: InjectionKey<FormGroupContext> = Symbol('FormGroupContext')
