<script setup lang="ts">
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
  <AtomsPanel class="personal-todo">
    <MoleculesSectionHeader
      title="パーソナルToDo"
      icon="check"
      size="sm"
    />

    <form class="personal-todo__input" @submit.prevent="handleAdd">
      <AtomsInput
        v-model="newTask"
        placeholder="新しいタスクを入力..."
      />
      <AtomsButton type="submit" variant="primary" icon-only>
        <AtomsIcon name="plus" />
      </AtomsButton>
    </form>

    <ul class="personal-todo__list">
      <li
        v-for="todo in sortedTodos"
        :key="todo.id"
        class="personal-todo__item"
      >
        <AtomsCheckbox
          :model-value="todo.completed"
          :class="{ 'is-completed': todo.completed }"
          :label="todo.text"
          @update:model-value="toggleTodo(todo.id)"
        />
        <AtomsButton
          variant="secondary"
          size="sm"
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
.personal-todo {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  &__input {
    display: flex;
    gap: var(--space-1);
    align-items: center;
    margin: 0;

    > *:first-child {
      flex: 1;
    }
  }

  &__list {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);

    max-height: 400px;
    margin: 0;
    padding: 0;

    list-style: none;
  }

  &__item {
    display: flex;
    gap: var(--space-1);
    align-items: center;
    justify-content: space-between;

    padding: var(--space-2);

    background-color: var(--color-bg-hover);

    .is-completed {
      text-decoration: line-through;
      opacity: 0.5;
    }
  }
}
</style>
