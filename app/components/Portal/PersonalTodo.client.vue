
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
        <AppIcon name="check" size="sm" /> 
        パーソナルToDo
      </h3>
    </div>
    
    <div class="p-personal-todo__input">
      <AppInput 
        v-model="newTask" 
        placeholder="新しいタスクを入力..." 
        @keyup.enter="handleAdd"
      />
      <AppButton variant="primary" @click="handleAdd">
        <AppIcon name="plus" size="sm" />
      </AppButton>
    </div>

    <ul class="p-personal-todo__list">
      <li v-for="todo in sortedTodos" :key="todo.id" class="p-personal-todo__item">
        <AppCheckbox 
          :model-value="todo.completed" 
          :class="{ 'is-completed': todo.completed }"
          :label="todo.text"
          @update:model-value="toggleTodo(todo.id)"
        />
        <AppButton variant="secondary" size="sm" @click="deleteTodo(todo.id)">
          <AppIcon name="trash-2" size="sm" />
        </AppButton>
      </li>
      <div v-if="todos.length === 0" class="u-text-muted u-text-sm" style="text-align: center; margin-top: 16px;">
        タスクはありません
      </div>
    </ul>
  </AppPanel>
</template>

<style scoped lang="scss">
.p-personal-todo {
  @include flex-column(var(--gap-component));

  &__header h3 {
    @include flex-start(var(--gap-element));
    @extend %text-md;
    color: var(--color-text-main);
  }

  &__input {
    @include flex-start(var(--gap-element));
    > *:first-child { flex: 1; }
  }

  &__list {
    @include flex-column(var(--gap-element));
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 400px;
    overflow-y: auto;
  }

  &__item {
    @include flex-between(var(--gap-element));
    padding: var(--pad-sm);
    background-color: var(--color-bg-hover);
    border-radius: var(--radius-sm);
    
    .is-completed {
      opacity: 0.5;
      text-decoration: line-through;
    }
  }
}
</style>
