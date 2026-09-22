<script setup lang="ts">
/**
 * PortalPersonalTodo
 * [Portal Organisms] 現場ダッシュボードのパーソナルToDo管理コンポーネント。
 */
import { ref } from 'vue'

import { useTodo } from '~/composables/portal/useTodo'

const props = defineProps<{
  siteId: string
}>()

const { todos, addTodo, deleteTodo } = useTodo(() => props.siteId)
const newTask = ref('')

const handleAdd = () => {
  const text = newTask.value.trim()

  if (!text) return
  addTodo(text)
  newTask.value = ''
}
</script>

<template>
  <Panel class="flex flex-col gap-3">
    <SectionHeader
      title="パーソナルToDo"
      icon="check"
      tag="h3"
    />

    <form class="flex items-center gap-1 m-0" @submit.prevent="handleAdd">
      <Input
        v-model="newTask"
        placeholder="新しいタスクを入力..."
        class="flex-1"
      />
      <Button type="submit" icon="plus" />
    </form>

    <ul
      v-if="todos.length > 0"
      class="overflow-y-auto flex flex-col gap-1 max-h-[400px] m-0 p-0 list-none"
    >
      <li
        v-for="todo in todos"
        :key="todo.id"
        class="todo-item flex items-center justify-between gap-1 p-2"
      >
        <Checkbox v-model="todo.completed">
          <span
            class="todo-label"
            :class="{ 'is-completed': todo.completed }"
          >
            {{ todo.text }}
          </span>
        </Checkbox>
        <Button
          variant="danger"
          icon="trash-2"
          @click="deleteTodo(todo.id)"
        />
      </li>
    </ul>

    <EmptyState
      v-else
      icon="check-circle"
      title="タスクはありません"
      description="上の入力欄から新しいタスクを追加してください。"
    />
  </Panel>
</template>

<style scoped lang="scss">
.todo-item {
  background-color: var(--color-bg-hover);
}

.todo-label {
  transition: var(--transition-base);

  &.is-completed {
    text-decoration: line-through;
    opacity: 0.5;
  }
}
</style>
