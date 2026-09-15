<script setup lang="ts">
/**
 * PortalOrganismsPersonalTodo
 * [Portal Organisms] 現場ダッシュボードのパーソナルToDo管理コンポーネント。
 * タスクの追加・一覧・完了トグル・削除をカプセル化して提供します。
 */
import { computed, ref } from 'vue'

import { useTodo } from '~/composables/portal/useTodo'

const props = defineProps<{
  siteId: string
}>()

// TODO: 本来は認証情報から取得するが、一時的に固定値
const loginId = computed(() => 'guest')
const { todos, addTodo, toggleTodo, deleteTodo } = useTodo(
  props.siteId,
  loginId.value,
)

const newTask = ref('')

const handleAdd = () => {
  addTodo(newTask.value)
  newTask.value = ''
}

const sortedTodos = computed(() => {
  return [...todos.value].sort((a, b) => {
    if (a.completed === b.completed) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }

    return a.completed ? 1 : -1
  })
})
</script>

<template>
  <AtomsPanel class="flex flex-col gap-3">
    <MoleculesSectionHeader
      title="パーソナルToDo"
      icon="check"
      size="sm"
    />

    <form class="flex items-center gap-1 m-0" @submit.prevent="handleAdd">
      <AtomsInput
        v-model="newTask"
        placeholder="新しいタスクを入力..."
        class="flex-1"
      />
      <AtomsButton type="submit" variant="secondary" icon-only>
        <AtomsIcon name="plus" />
      </AtomsButton>
    </form>

    <ul class="overflow-y-auto flex flex-col gap-1 max-h-[400px] m-0 p-0 list-none">
      <li
        v-for="todo in sortedTodos"
        :key="todo.id"
        class="todo-item flex items-center justify-between gap-1 p-2"
      >
        <AtomsCheckbox
          :model-value="todo.completed"
          :class="{ 'is-completed': todo.completed }"
          :label="todo.text"
          @update:model-value="toggleTodo(todo.id)"
        />
        <AtomsButton
          variant="secondary"
          icon-only
          @click="deleteTodo(todo.id)"
        >
          <AtomsIcon name="trash-2" />
        </AtomsButton>
      </li>
      <MoleculesEmptyState
        v-if="todos.length === 0"
        icon="check-circle"
        title="タスクはありません"
        description="上の入力欄から新しいタスクを追加してください。"
      />
    </ul>
  </AtomsPanel>
</template>

<style scoped lang="scss">
.todo-item {
  background-color: var(--color-bg-hover);
}

.is-completed {
  text-decoration: line-through;
  opacity: 0.5;
}
</style>
