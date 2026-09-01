<script setup lang="ts">
import { computed, ref } from 'vue'

import { useTodo } from '~/composables/portal/useTodo'

const props = defineProps<{
  siteId: string
}>()

// TODO: 本来は認証情報から取得するが、一時的に固定値
const loginId = computed(() => 'guest')
const { todos, addTodo, toggleTodo, deleteTodo } = useTodo(props.siteId, loginId.value)

const newTask = ref('')

const handleAdd = () => {
  addTodo(newTask.value)
  newTask.value = ''
}

// 未完了を上に、完了を下に
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
  <AppPanel class="p-personal-todo">
    <div class="p-personal-todo__header">
      <h3>
        <AppIcon
          name="check"
          size="sm"
        />
        パーソナルToDo
      </h3>
    </div>

    <div class="p-personal-todo__input">
      <AppInput
        v-model="newTask"
        placeholder="新しいタスクを入力..."
        @keyup.enter="handleAdd"
      />
      <AppButton
        variant="primary"
        icon-only
        @click="handleAdd"
      >
        <AppIcon
          name="plus"
        />
      </AppButton>
    </div>

    <ul class="p-personal-todo__list">
      <li
        v-for="todo in sortedTodos"
        :key="todo.id"
        class="p-personal-todo__item"
      >
        <AppCheckbox
          :model-value="todo.completed"
          :class="{ 'is-completed': todo.completed }"
          :label="todo.text"
          @update:model-value="toggleTodo(todo.id)"
        />
        <AppButton
          variant="secondary"
          size="sm"
          icon-only
          @click="deleteTodo(todo.id)"
        >
          <AppIcon
            name="trash-2"
          />
        </AppButton>
      </li>
      <AppEmptyState
        v-if="todos.length === 0"
        icon="check-circle"
        title="タスクはありません"
        description="上の入力欄から新しいタスクを追加してください。"
      />
    </ul></AppPanel>
</template>

<style scoped lang="scss">
.p-personal-todo {
  @include flex-start-stretch($direction: column);

  gap: var(--space-3);

  &__header h3 {
    @include flex-start-center;
    @include text-title("sm");

    gap: var(--space-1);
    color: var(--color-text-main);
  }

  &__input {
    @include flex-start-center;

    gap: var(--space-1);
    > *:first-child { flex: 1; }
  }

  &__list {
    @include flex-start-stretch($direction: column);

    overflow-y: auto;
    gap: var(--space-1);
    max-height: 400px;
  }

  &__item {
    @include flex-between-center;

    gap: var(--space-1);
    padding: var(--space-2);
    background-color: var(--color-bg-hover);

    .is-completed {
      text-decoration: line-through;
      opacity: 0.5;
    }
  }
}
</style>
