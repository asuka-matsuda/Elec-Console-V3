<script setup lang="ts">
/**
 * AppFormGroup
 * フォームのラベル、入力項目、エラーメッセージ、ヘルプテキストをグループ化して表示するコンポーネントです。
 */
withDefaults(
  defineProps<{
    label?: string;
    required?: boolean;
    error?: string;
    help?: string;
  }>(),
  {
    required: false,
  },
);
</script>

<template>
  <div class="c-form-group">
    <div class="c-form-group__inner">
      <!-- Label Area -->
      <div v-if="label || $slots.label" class="c-form-group__label-wrapper">
        <label class="c-form-label">
          <slot name="label">{{ label }}</slot>
        </label>
        <AppBadge
          v-if="required"
          variant="danger"
          size="sm"
          class="c-form-group__required"
        >
          REQUIRED
        </AppBadge>
      </div>

      <!-- Input Control Area -->
      <div class="c-form-group__control">
        <slot />

        <!-- Error Message -->
        <transition name="fade-slide">
          <div v-if="error" class="c-form-group__error">
            {{ error }}
          </div>
        </transition>

        <!-- Help Text -->
        <div v-if="help && !error" class="c-form-group__help">
          {{ help }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-form-group {
  // --- レイアウト・配置 ---
  container-type: inline-size;

  // --- ボックスモデル ---
  width: 100%;

  // --- 子要素 ---
  &__inner {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-component));

    // --- ボックスモデル ---
    width: 100%;

    // If the .c-form-group container is wide enough (>= xs), switch to horizontal layout
    @include cq("xs") {
      // --- レイアウト・配置 ---
      flex-direction: row;
      align-items: flex-start;

      // --- 子要素 ---
      .c-form-group__label-wrapper {
        // --- レイアウト・配置 ---
        flex-shrink: 0;

        // --- ボックスモデル ---
        width: 140px;

        // Align label with the text inside a medium input control
        padding-top: calc(
          (
              var(--size-control-md) - var(--line-height-base) *
                var(--font-size-sm)
            ) /
            2
        );
      }

      .c-form-group__control {
        // --- レイアウト・配置 ---
        flex: 1;

        // --- ボックスモデル ---
        min-width: 0;
      }
    }
  }

  &__label-wrapper {
    // --- レイアウト・配置 ---
    @include flex-start(var(--gap-element));
  }

  &__control {
    // --- レイアウト・配置 ---
    position: relative;

    @include flex-column(var(--gap-element));
  }

  &__error {
    // --- 継承 ---
    @extend %text-meta;

    // --- タイポグラフィ ---
    color: var(--color-status-danger);

    // --- 視覚効果 ---
    @include cyber-text-glow(var(--color-status-danger), 30%, var(--blur-sm));
  }

  &__help {
    // --- 継承 ---
    @extend %text-meta;
  }
}

// Label Component Styles (Legacy _c-form-label)
.c-form-label {
  // --- レイアウト・配置 ---
  @include flex-start(var(--gap-element));

  // --- 継承 ---
  @extend %text-title-sm;

  // --- その他 ---
  user-select: none;

  // --- タイポグラフィ ---

  // Default state: slightly dimmed
  color: theme-color(var(--color-category-main), 70%);
  text-transform: uppercase;

  // --- 視覚効果 ---
  transition: var(--transition-base);

  // Cyber glowing dot

  // --- 疑似要素 ---
  &::before {
    // --- CSSカスタムプロパティ ---
    --glow-color: theme-color(var(--color-category-main), 30%);

    content: "";

    // --- レイアウト・配置 ---
    display: inline-block;

    // --- ボックスモデル ---
    width: var(--size-2);
    height: var(--size-2);
    @include border-base(theme-color(var(--color-category-main), 70%), var(--border-width-thick));
    border-radius: 50%;

    // --- 視覚効果 ---
    box-shadow: var(--shadow-glow-sm);

    transition: var(--transition-base);
  }
}

// フォームグループ内がフォーカスされたらラベルを発光させる
.c-form-group:focus-within .c-form-label {
  // --- タイポグラフィ ---
  color: var(--color-category-main);

  // --- 視覚効果 ---
  @include cyber-text-glow;

  // --- 疑似要素 ---
  &::before {
    // --- ボックスモデル ---
    border-color: var(--color-category-main);

    // --- 視覚効果 ---
    box-shadow: var(--shadow-glow-md);
  }
}

// フォームグループ内にエラー要素（.c-form-group__error や .is-error 等）が存在する場合、ラベルを赤くする
.c-form-group:has(.c-form-group__error, :invalid, .is-error)
  .c-form-label {
  // --- タイポグラフィ ---
  color: var(--color-status-danger);

  // --- 視覚効果 ---
  @include cyber-text-glow(var(--color-status-danger));

  // --- 疑似要素 ---
  &::before {
    // --- CSSカスタムプロパティ ---
    --glow-color: var(--color-status-danger);

    // --- ボックスモデル ---
    border-color: var(--color-status-danger);

    // --- 視覚効果 ---
    box-shadow: var(--shadow-glow-md);
  }
}
</style>

<style lang="scss">
// --- Fade Slide ---
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-base),
    transform var(--duration-fast) var(--ease-base);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}
</style>
