<script setup lang="ts">
/**
 * DiagramTerminal
 * [Database Component] 銅線用裸圧着端子（R形・丸形）の各部寸法のテクニカル図解。
 */
const SPECS = [
  {
    symbol: 'B',
    title: '舌部幅 (端子幅)',
    desc: '端子台の隔壁幅や小型ブレーカーピッチとの干渉確認に必須。干渉する場合は幅の狭い<strong>「S形（小判型）」</strong>を選定します。',
    color: '#39c5cf',
  },
  {
    symbol: 'φd2',
    title: 'スタッド穴径',
    desc: '機器側のボルトサイズ（M3.5, M4, M5, M8等）に適合する取付穴径。穴が大きすぎると接触面積不足や緩みの原因になります。',
    color: '#39c5cf',
  },
  {
    symbol: 'L',
    title: '全長',
    desc: '端子全体の長さ。分電盤や制御盤内の電線曲げスペース、および端子台の透明防護カバー内に収まるかの確認に用います。',
    color: '#a371f7',
  },
]
</script>

<template>
  <div class="terminal-diagram flex flex-col gap-panel-gap">
    <div class="diagram-svg-container w-full overflow-x-auto">
      <div class="diagram-svg-inner mx-auto">
        <svg
          viewBox="0 0 430 220"
          class="diagram-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker
              id="arrow-cyan"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#39c5cf" />
            </marker>
            <marker
              id="arrow-purple"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#a371f7" />
            </marker>
          </defs>

          <g opacity="0.12" stroke="#8b949e" stroke-width="0.5" stroke-dasharray="2,4">
            <line x1="20" y1="110" x2="415" y2="110" />
            <line x1="130" y1="20" x2="130" y2="200" />
          </g>

          <g>
            <path
              d="
                M 130 50
                A 60 60 0 1 0 130 170
                L 210 148
                L 330 148
                A 6 6 0 0 0 336 142
                L 336 78
                A 6 6 0 0 0 330 72
                L 210 72
                Z
              "
              fill="rgba(57, 197, 207, 0.08)"
              stroke="#58a6ff"
              stroke-width="2"
              stroke-linejoin="round"
            />

            <line x1="200" y1="84" x2="336" y2="84" stroke="#58a6ff" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.6" />
            <line x1="200" y1="136" x2="336" y2="136" stroke="#58a6ff" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.6" />
            <line x1="200" y1="84" x2="200" y2="136" stroke="#58a6ff" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.6" />

            <circle
              cx="130"
              cy="110"
              r="24"
              fill="var(--surface-bg-solid)"
              stroke="#58a6ff"
              stroke-width="2"
            />
            <line x1="100" y1="110" x2="160" y2="110" stroke="#58a6ff" stroke-width="0.8" stroke-dasharray="4,3" opacity="0.7" />
            <line x1="130" y1="80" x2="130" y2="140" stroke="#58a6ff" stroke-width="0.8" stroke-dasharray="4,3" opacity="0.7" />
          </g>

          <g>
            <line x1="50" y1="50" x2="68" y2="50" stroke="#8b949e" stroke-width="0.8" />
            <line x1="50" y1="170" x2="68" y2="170" stroke="#8b949e" stroke-width="0.8" />
            <line
              x1="55"
              y1="54"
              x2="55"
              y2="166"
              stroke="#39c5cf"
              stroke-width="1.5"
              marker-start="url(#arrow-cyan)"
              marker-end="url(#arrow-cyan)"
            />
            <rect x="36" y="98" width="38" height="24" rx="4" fill="#161b22" stroke="#39c5cf" stroke-width="1" />
            <text x="55" y="115" fill="#39c5cf" font-size="13" font-weight="bold" font-family="monospace" text-anchor="middle">B</text>
          </g>

          <g>
            <line x1="130" y1="110" x2="165" y2="65" stroke="#39c5cf" stroke-width="1.2" marker-start="url(#arrow-cyan)" />
            <line x1="165" y1="65" x2="195" y2="65" stroke="#39c5cf" stroke-width="1.2" />
            <rect x="195" y="53" width="48" height="24" rx="4" fill="#161b22" stroke="#39c5cf" stroke-width="1" />
            <text x="219" y="70" fill="#39c5cf" font-size="12" font-weight="bold" font-family="monospace" text-anchor="middle">φd2</text>
          </g>

          <g>
            <line x1="336" y1="84" x2="365" y2="84" stroke="#8b949e" stroke-width="0.8" />
            <line x1="336" y1="136" x2="365" y2="136" stroke="#8b949e" stroke-width="0.8" />
            <line
              x1="355"
              y1="88"
              x2="355"
              y2="132"
              stroke="#39c5cf"
              stroke-width="1.2"
              marker-start="url(#arrow-cyan)"
              marker-end="url(#arrow-cyan)"
            />
            <rect x="362" y="98" width="46" height="24" rx="4" fill="#161b22" stroke="#39c5cf" stroke-width="1" />
            <text x="385" y="115" fill="#39c5cf" font-size="12" font-weight="bold" font-family="monospace" text-anchor="middle">φd1</text>
          </g>

          <g>
            <line x1="70" y1="170" x2="70" y2="200" stroke="#8b949e" stroke-width="0.8" />
            <line x1="336" y1="148" x2="336" y2="200" stroke="#8b949e" stroke-width="0.8" />
            <line
              x1="74"
              y1="195"
              x2="332"
              y2="195"
              stroke="#a371f7"
              stroke-width="1.5"
              marker-start="url(#arrow-purple)"
              marker-end="url(#arrow-purple)"
            />
            <rect x="185" y="183" width="38" height="24" rx="4" fill="#161b22" stroke="#a371f7" stroke-width="1" />
            <text x="204" y="200" fill="#a371f7" font-size="13" font-weight="bold" font-family="monospace" text-anchor="middle">L</text>
          </g>
        </svg>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-item-gap">
      <div
        v-for="item in SPECS"
        :key="item.symbol"
        class="diagram-spec-panel flex flex-col gap-inline-gap"
      >
        <div class="flex items-center gap-inline-gap">
          <span
            class="spec-symbol inline-flex items-center justify-center"
            :style="{
              color: item.color,
              borderColor: `color-mix(in srgb, ${item.color} 40%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${item.color} 15%, transparent)`,
            }"
          >
            {{ item.symbol }}
          </span>
          <span class="spec-title">{{ item.title }}</span>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p class="spec-desc" v-html="item.desc" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.terminal-diagram {
  width: 100%;
}

.diagram-svg-container {
  padding: var(--space-panel-pad-compact);
  border: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg-solid);
}

.diagram-svg-inner {
  width: 100%;
  max-width: 480px;
}

.diagram-svg {
  width: 100%;
  height: auto;
}

.diagram-spec-panel {
  padding: var(--space-panel-pad-compact);
  border: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg);
}

.spec-symbol {
  min-width: 24px;
  height: 24px;
  padding: 0 var(--space-1);
  border-style: solid;
  border-width: var(--border-width-base);

  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.spec-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);
}

.spec-desc {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);

  strong {
    color: var(--color-text-main);
  }
}
</style>
