/**
 * @fileoverview Torque Data Master
 * トルクデータベース。
 * 各ボルトサイズ、機器端子、銅帯等の推奨締付トルクを定義。
 */

export const torqueData = [
  {
    category: "一般ボルト",
    reference: "JIS B 1180 強度区分4.8相当",
    items: [
      { size: "M3", torque_nm: 0.6, range_nm: "0.5 ~ 0.7", note: "" },
      { size: "M4", torque_nm: 1.5, range_nm: "1.2 ~ 1.8", note: "" },
      { size: "M5", torque_nm: 3.0, range_nm: "2.5 ~ 3.5", note: "" },
      { size: "M6", torque_nm: 5.2, range_nm: "4.5 ~ 6.0", note: "" },
      { size: "M8", torque_nm: 12.5, range_nm: "10.0 ~ 15.0", note: "" },
      { size: "M10", torque_nm: 24.5, range_nm: "20.0 ~ 30.0", note: "" },
      { size: "M12", torque_nm: 42.0, range_nm: "35.0 ~ 50.0", note: "" },
      { size: "M16", torque_nm: 106.0, range_nm: "90.0 ~ 120.0", note: "" },
    ],
  },
  {
    category: "機器端子台",
    reference: "三菱電機・富士電機等の標準値目安",
    items: [
      {
        size: "M3.5",
        torque_nm: 1.0,
        range_nm: "0.8 ~ 1.2",
        note: "電磁接触器操作回路等",
      },
      {
        size: "M4",
        torque_nm: 1.5,
        range_nm: "1.2 ~ 1.8",
        note: "小容量ブレーカー等",
      },
      { size: "M5", torque_nm: 2.5, range_nm: "2.0 ~ 3.0", note: "" },
      { size: "M6", torque_nm: 4.5, range_nm: "4.0 ~ 5.0", note: "" },
      {
        size: "M8",
        torque_nm: 9.0,
        range_nm: "8.0 ~ 10.0",
        note: "中容量ブレーカー主回路",
      },
      {
        size: "M10",
        torque_nm: 18.0,
        range_nm: "15.0 ~ 20.0",
        note: "大容量ブレーカー主回路",
      },
      { size: "M12", torque_nm: 30.0, range_nm: "25.0 ~ 35.0", note: "" },
    ],
  },
  {
    category: "銅帯・ブスバー",
    reference: "JSIA (日本配電盤工業会) 推奨値",
    items: [
      {
        size: "M6",
        torque_nm: 5.5,
        range_nm: "4.5 ~ 6.5",
        note: "平座金＋ばね座金",
      },
      {
        size: "M8",
        torque_nm: 13.0,
        range_nm: "11.0 ~ 15.0",
        note: "平座金＋ばね座金",
      },
      {
        size: "M10",
        torque_nm: 25.0,
        range_nm: "20.0 ~ 30.0",
        note: "平座金＋ばね座金",
      },
      {
        size: "M12",
        torque_nm: 45.0,
        range_nm: "40.0 ~ 50.0",
        note: "平座金＋ばね座金",
      },
      {
        size: "M16",
        torque_nm: 110.0,
        range_nm: "95.0 ~ 125.0",
        note: "平座金＋ばね座金",
      },
    ],
  },
];
