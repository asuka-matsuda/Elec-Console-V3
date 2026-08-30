<script setup lang="ts">
import { ref, watch } from "vue";
import { useAdminUsers } from "~/composables/admin/useAdminUsers";
import { useAdminSites } from "~/composables/admin/useAdminSites";

const props = defineProps<{
  userId: string;
  initialSiteIds: string[];
}>();

const isOpen = defineModel<boolean>({ default: false });
const emit = defineEmits<{
  (e: "success"): void;
}>();

const { assignSites } = useAdminUsers();
const { sites } = useAdminSites();

const targetSiteIds = ref<string[]>([]);

watch(isOpen, (newVal) => {
  if (newVal) {
    targetSiteIds.value = [...props.initialSiteIds];
  }
});

const handleSave = async () => {
  // 例外は AppFormModal でキャッチされるため、単に await するだけでOK
  await assignSites(props.userId, targetSiteIds.value);
  emit("success");
};
</script>

<template>
  <AppFormModal
    v-model="isOpen"
    title="現場アサイン管理"
    :submit-fn="handleSave"
    submit-text="アサインを保存"
  >
    <p class="c-user-assign-modal__desc">
      このユーザーが参加・閲覧できる現場を選択してください。
    </p>

    <template
      v-for="site in sites"
      :key="site.id"
    >
      <AppFormGroup>
        <AppCheckbox
          v-model="targetSiteIds"
          :value="site.id"
          :label="site.name"
        />
      </AppFormGroup>
    </template>
  </AppFormModal>
</template>

<style scoped lang="scss">
.c-user-assign-modal__desc {
  @include text-desc;
}
</style>
