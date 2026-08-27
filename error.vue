
<template>
  <div style="padding: 20px; color: red;">
    <h1>Error!</h1>
    <pre>{{ error }}</pre>
    <button @click="clearError({ redirect: '/' })">Go Home</button>
  </div>
</template>

<script setup>
const props = defineProps({
  error: Object
})
</script>
