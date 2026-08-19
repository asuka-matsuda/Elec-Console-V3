<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const isActive = ref(false);
const hoveredClass = ref("");
const mousePos = ref({ x: 0, y: 0 });

const toggleVisualizer = () => {
  isActive.value = !isActive.value;
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isActive.value) return;

  mousePos.value = { x: e.clientX, y: e.clientY };

  const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
  if (el && typeof el.className === "string" && el.className.trim() !== "") {
    // ツールチップやボタン自体は除外
    if (
      !el.closest(".c-debug-visualizer-btn") &&
      !el.closest(".c-debug-tooltip")
    ) {
      const classes = el.className.trim().split(/\s+/).join(".");
      hoveredClass.value = "." + classes;
    } else {
      hoveredClass.value = "";
    }
  } else if (el && el.tagName) {
    // クラスがない場合はタグ名を表示
    hoveredClass.value = "<" + el.tagName.toLowerCase() + ">";
  } else {
    hoveredClass.value = "";
  }
};

onMounted(() => {
  window.addEventListener("mousemove", handleMouseMove);
});

onUnmounted(() => {
  window.removeEventListener("mousemove", handleMouseMove);
});
</script>

<template>
  <!-- Floating Action Button -->
  <button
    class="c-debug-visualizer-btn"
    :class="{ 'is-active': isActive }"
    title="Toggle Layout Visualizer"
    @click="toggleVisualizer"
  >
    <AppIcon name="bug" class="c-debug-visualizer-btn__icon" />
  </button>

  <!-- Global Styles & Tooltip Injected on Active -->
  <Teleport to="body">
    <!-- Class Name Tooltip -->
    <div
      v-if="isActive && hoveredClass"
      class="c-debug-tooltip"
      :style="{ left: mousePos.x + 15 + 'px', top: mousePos.y + 15 + 'px' }"
    >
      {{ hoveredClass }}
    </div>

    <component :is="'style'" v-if="isActive">
      /* * ========================================== * Layout Visualizer Styles
      * ========================================== */ * { outline: 1px solid
      rgba(255, 0, 0, 0.4) !important; } /* Hover highlight for specific
      elements */ *:hover { outline: 2px solid rgba(0, 255, 255, 0.8)
      !important; }
    </component>
  </Teleport>
</template>

<style scoped>
.c-debug-tooltip {
  position: fixed;
  background: rgb(0 0 0 / 85%);
  color: #0ff;
  padding: var(--space-1) var(--space-2);
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
  z-index: 999999;
  pointer-events: none;
  white-space: nowrap;
  border: 1px solid rgb(0 255 255 / 30%);
  box-shadow: 0 2px 8px rgb(0 0 0 / 50%);
}

.c-debug-visualizer-btn {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #333;
  color: #fff;
  border: 2px solid #555;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 99999;
  box-shadow: 0 4px 12px rgb(0 0 0 / 50%);
  transition: all 0.2s ease;
}

.c-debug-visualizer-btn:hover {
  transform: scale(1.1);
  background-color: #444;
}

.c-debug-visualizer-btn.is-active {
  background-color: #f03;
  border-color: #fcc;
  box-shadow: 0 0 15px rgb(255 0 51 / 60%);
  animation: pulse-danger 2s infinite;
}

.c-debug-visualizer-btn__icon {
  width: 24px;
  height: 24px;
}

@keyframes pulse-danger {
  0% {
    box-shadow: 0 0 0 0 rgb(255 0 51 / 70%);
  }

  70% {
    box-shadow: 0 0 0 10px rgb(255 0 51 / 0%);
  }

  100% {
    box-shadow: 0 0 0 0 rgb(255 0 51 / 0%);
  }
}
</style>
