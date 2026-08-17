/**
 * @fileoverview System Data Master
 * 電気方式（相・線式）マスターデータ。
 * 各方式の計算用パラメータ定義、表示タグ管理、およびUI連携用のデータを保持します。
 */

export const systemData = [
    {
        id: '1P2W100',
        label: '単相2線式 100V',
        tags: ['lighting', 'power'],
        voltage: 100,
        coefficient: 2,
        reqCores: '2C',
        kwDivisor: 100,
        simpleK: 35.6
    },
    {
        id: '1P2W200',
        label: '単相2線式 200V',
        tags: ['lighting', 'power'],
        voltage: 200,
        coefficient: 2,
        reqCores: '2C',
        kwDivisor: 200,
        simpleK: 35.6
    },
    {
        id: '1P3W200',
        label: '単相3線式 100/200V',
        tags: ['lighting'],
        voltage: 100,
        coefficient: 1,
        reqCores: '3C',
        kwDivisor: 200,
        simpleK: 17.8
    },
    {
        id: '3P3W200',
        label: '三相3線式 200V',
        tags: ['power'],
        voltage: 200,
        coefficient: 1.732,
        reqCores: '3C',
        kwDivisor: 200 * 1.732,
        simpleK: 30.8
    },
    {
        id: '3P3W400',
        label: '三相3線式 400V',
        tags: ['power'],
        voltage: 400,
        coefficient: 1.732,
        reqCores: '3C',
        kwDivisor: 400 * 1.732,
        simpleK: 30.8
    }
];

/**
 * 指定されたタグに一致する方式のオプションデータ配列を生成します。
 * @param {string} filterTag - 抽出するタグ ('lighting', 'power', 'all' 等)
 * @returns {Array<Object>} FormBuilder互換のオプション配列
 */
export function getPhaseOptions(filterTag = 'all') {
    const filtered =
        filterTag === 'all' ? systemData : systemData.filter((sys) => sys.tags.includes(filterTag));

    return [
        { value: '', text: '選択してください', disabled: true, selected: true },
        ...filtered.map((sys) => ({ value: sys.id, text: sys.label }))
    ];
}
