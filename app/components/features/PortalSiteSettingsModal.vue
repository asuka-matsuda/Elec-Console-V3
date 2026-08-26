<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Site } from "~/types/admin";
import { useAdminUsers } from "~/composables/admin/useAdminUsers";

const props = defineProps<{
  site: Site | null;
}>();

const emit = defineEmits<{
  (e: "update:site", site: Site): void;
  (e: "close"): void;
}>();

const isOpen = defineModel<boolean>({ default: false });

const { users, fetchUsers } = useAdminUsers();

// Edit state
const editData = ref<Partial<Site>>({});
const excludedCircuitsInput = ref("");

watch(() => props.site, (newSite) => {
  if (newSite) {
    editData.value = { ...newSite };
    excludedCircuitsInput.value = (newSite.excludedCircuits || []).join("\n");
  } else {
    editData.value = {};
    excludedCircuitsInput.value = "";
  }
}, { immediate: true });

watch(isOpen, async (val) => {
  if (val && users.value.length === 0) {
    await fetchUsers();
  }
});

const statusOptions = [
  { label: "計画中", value: "planning" },
  { label: "進行中", value: "in_progress" },
  { label: "完了", value: "completed" },
  { label: "保留", value: "on_hold" },
];

const tabs = [
  { value: "basic", label: "基本設定", icon: "info" },
  { value: "integration", label: "連携設定", icon: "link" },
  { value: "rules", label: "ルール設定", icon: "filter" },
];
const activeTab = ref("basic");

// ワーカー名解決
const workerNames = computed(() => {
  if (!editData.value.workers) return [];
  return editData.value.workers.map(id => {
    const u = users.value.find(user => user.id === id);
    return u ? `${u.lastName} ${u.firstName}` : "不明なユーザー";
  });
});

const handleSave = async () => {
  if (!props.site) return;
  // Parse excluded circuits
  const parsedCircuits = excludedCircuitsInput.value
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  const payload: Site = {
    ...props.site,
    ...editData.value,
    excludedCircuits: parsedCircuits
  };
  
  emit("update:site", payload);
  isOpen.value = false;
};

// Dummy DB sync functions
const showSyncMsg = ref(false);
const syncMsg = ref("");
const handleImport = () => {
  syncMsg.value = "Excelからデータの取込が完了しました（ダミー）";
  showSyncMsg.value = true;
  setTimeout(() => showSyncMsg.value = false, 3000);
};
const handleExport = () => {
  syncMsg.value = "Excelへデータを書戻しました（ダミー）";
  showSyncMsg.value = true;
  setTimeout(() => showSyncMsg.value = false, 3000);
};
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="現場設定"
    icon="settings"
    @cancel="isOpen = false"
  >
    <div class="c-site-settings">
      <AppTabs v-model="activeTab" :options="tabs" />

      <div class="c-site-settings__content">
        <!-- 基本設定 -->
        <template v-if="activeTab === 'basic'">
          <AppFormGroup label="ステータス">
            <AppSelect v-model="(editData.status as string)" :options="statusOptions" />
          </AppFormGroup>
          <AppFormGroup label="現場ID (半角英数)">
            <AppInput v-model="(editData.id as string)" placeholder="例: site-tokyo-01" />
          </AppFormGroup>
          <AppFormGroup label="現場名">
            <AppInput v-model="editData.name" />
          </AppFormGroup>
          <AppFormGroup label="アサイン済ワーカー">
            <div class="c-site-settings__workers">
              <template v-if="workerNames.length > 0">
                <AppBadge v-for="(name, idx) in workerNames" :key="idx" variant="neutral">
                  {{ name }}
                </AppBadge>
              </template>
              <div v-else class="u-text-muted u-text-sm">
                アサインされているワーカーはいません
              </div>
            </div>
          </AppFormGroup>
        </template>

        <!-- 連携設定 -->
        <template v-else-if="activeTab === 'integration'">
          <AppFormGroup label="Excel連携ファイル保存先 (絶対パス)">
            <AppInput v-model="editData.excelPath" placeholder="例: D:\Data\site_a.xlsm" />
          </AppFormGroup>
          <AppFormGroup label="帳票テンプレート保存先 (絶対パス)">
            <AppInput v-model="editData.reportTemplatePath" placeholder="例: D:\Templates\report.xlsx" />
          </AppFormGroup>

          <AppPanel title="データベース連携" class="u-mt-6">
            <div class="c-site-settings__sync-actions">
              <AppButton variant="danger" icon="download" @click="handleImport">
                Excelから取込 (初期化)
              </AppButton>
              <AppButton variant="primary" icon="upload" @click="handleExport">
                Excelへ書戻し
              </AppButton>
            </div>
            <div v-if="showSyncMsg" class="c-site-settings__sync-msg">
              {{ syncMsg }}
            </div>
          </AppPanel>
        </template>

        <!-- ルール設定 -->
        <template v-else-if="activeTab === 'rules'">
          <AppFormGroup label="除外回路の設定">
            <template #description>
              計算や連携の対象外とする回路を改行区切りで入力してください。
            </template>
            <textarea
              v-model="excludedCircuitsInput"
              class="c-site-settings__textarea"
              rows="6"
              placeholder="盤A-回路1
盤B-回路2"
            ></textarea>
          </AppFormGroup>
        </template>
      </div>
    </div>

    <template #footer>
      <AppButton variant="secondary" @click="isOpen = false">キャンセル</AppButton>
      <AppButton variant="primary" @click="handleSave">保存する</AppButton>
    </template>
  </AppModal>
</template>

<style lang="scss" scoped>
.c-site-settings {
  @include flex-column(var(--gap-lg));

  &__content {
    @include flex-column(var(--gap-md));
    min-height: 300px;
  }

  &__workers {
    @include flex-start(var(--gap-sm));
    flex-wrap: wrap;
    min-height: 40px;
    padding: var(--gap-sm);
    @include border-dim;
    // border-radius PROHIBITED
  }

  &__sync-actions {
    @include flex-start(var(--gap-md));
  }

  &__sync-msg {
    margin-top: var(--gap-sm);
    color: var(--color-success);
    font-size: var(--text-sm);
  }

  &__textarea {
    width: 100%;
    padding: var(--gap-sm) var(--gap-md);
    @include border-dim;
    background-color: transparent; // No background colors!
    backdrop-filter: blur(8px);
    color: var(--color-text-main);
    font-family: inherit;
    font-size: var(--text-md);
    resize: vertical;

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }
}
</style>
