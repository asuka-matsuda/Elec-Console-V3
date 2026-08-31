import { useNuxtApp } from '#app';

/**
 * 共通 API クライアント ($api)
 * plugins/api.ts で生成・提供されている $api インスタンスを一元取得します。
 */
export const useApi = () => {
  const { $api } = useNuxtApp();

  return {
    $api,
  };
};
