<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTodo } from '~/composables/portal/useTodo';

const props = defineProps<{
  siteId: string;
}>();

// TODO: 本来は認証情報から取得するが、一時的に固定値
const loginId = computed(() => 'guest');
const { todos, addTodo, toggleTodo, deleteTodo } = useTodo(props.siteId, loginId.value);

const newTask = ref('');

const handleAdd = () => {
  addTodo(newTask.value);
  newTask.value = '';
};

// 未完了を上に、完了を下に
const sortedTodos = computed(() => {
  return [...todos.value].sort((a, b) => {
    if (a.completed === b.completed) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.completed ? 1 : -1;
  });
});
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
        @click="handleAdd"
      >
        <AppIcon
          name="plus"
          size="sm"
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
          @click="deleteTodo(todo.id)"
        >
          <AppIcon
            name="trash-2"
            size="sm"
          />
        </AppButton>
      </li>
      <div
        v-if="todos.length === 0"
        class="p-personal-todo__empty"
      >
        タスクはありません
      </div>
    </ul>
  </AppPanel>
</template>

<style scoped lang="scss">
.p-personal-todo {
  @include flex-column(var(--space-stack-gap));

  &__header h3 {
    @include flex-start(var(--space-1));
    @include text-md;

    color: var(--color-text-main);
  }

  &__input {
    @include flex-start(var(--space-1));
    > *:first-child { flex: 1; }
  }

  &__list {
    @include flex-column(var(--space-1));

    overflow-y: auto;

    max-height: 400px;
    margin: 0;
    padding: 0;

    list-style: none;
  }

  &__item {
    @include flex-between(var(--space-inline-gap-sm));

    padding: var(--space-card-pad-sm);
    border-radius: var(--radius-sm);
    background-color: var(--color-bg-hover);
    
    .is-completed {
      text-decoration: line-through;
      opacity: 0.5;
    }
  }

  &__empty {
    @include text-desc;

    padding: var(--space-card-pad) 0;
    color: var(--color-text-muted);
    text-align: center;
  }
}
</style>
