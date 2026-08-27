
import { useLocalStorage } from '@vueuse/core';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export const useTodo = (siteId: string, loginId: string) => {
  // localStorage のキーに loginId と siteId を含めて「パーソナル」にする
  const storageKey = `elec-todos-${siteId}-${loginId}`;
  const todos = useLocalStorage<TodoItem[]>(storageKey, []);

  const addTodo = (text: string) => {
    if (!text.trim()) return;
    todos.value.push({
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    });
  };

  const toggleTodo = (id: string) => {
    const todo = todos.value.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  };

  const deleteTodo = (id: string) => {
    todos.value = todos.value.filter(t => t.id !== id);
  };

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
  };
};
