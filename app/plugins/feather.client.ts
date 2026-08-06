export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('page:finish', () => {
    if (typeof window !== 'undefined' && window.feather) {
      window.feather.replace();
    }
  });
});