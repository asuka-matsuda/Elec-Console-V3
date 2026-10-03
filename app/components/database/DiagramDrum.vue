<script setup lang="ts">
/**
 * DiagramDrum
 * [Database Component] 木製ケーブルドラムの各部寸法（正面図・側面断面図）のテクニカル図解。
 */
const SPECS = [
  {
    symbol: 'ツバ',
    title: 'ツバ径（外径）',
    desc: 'ドラム最大外径。トラック荷台の積載高さ制限や現場搬入口・開口部の有効通過高さの確認に必須です。',
    color: '#58a6ff',
  },
  {
    symbol: '胴',
    title: '胴径（巻胴）',
    desc: 'ケーブルを巻き付ける芯の直径。太物ケーブル（CVT等）の許容曲げ半径を下回らない規格が選定されます。',
    color: '#39c5cf',
  },
  {
    symbol: '幅',
    title: '外幅・内幅',
    desc: '外幅は現場通路やエレベーター扉の通過寸法、内幅はケーブルが整列して巻ける有効幅を示します。',
    color: '#a371f7',
  },
  {
    symbol: '軸',
    title: '軸穴径',
    desc: 'ドラムジャッキやコロに通すシャフト（パイプ軸）の適合径。現場治具のシャフト径と照合して確認します。',
    color: '#e3b341',
  },
]
</script>

<template>
  <div class="drum-diagram flex flex-col gap-panel-gap">
    <div class="diagram-svg-container w-full overflow-x-auto">
      <div class="diagram-svg-inner mx-auto">
        <svg
          viewBox="0 0 720 250"
          class="diagram-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker
              id="arrow-cyan-drum"
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
              id="arrow-purple-drum"
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

          <g transform="translate(140, 125)">
            <text x="0" y="-105" fill="#8b949e" font-size="12" font-weight="bold" text-anchor="middle">【正面図】</text>

            <line x1="-100" y1="0" x2="100" y2="0" stroke="#8b949e" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6" />
            <line x1="0" y1="-100" x2="0" y2="100" stroke="#8b949e" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6" />

            <circle cx="0" cy="0" r="90" fill="rgba(88, 166, 255, 0.05)" stroke="#58a6ff" stroke-width="2" />
            <circle cx="-50" cy="-50" r="3" fill="#8b949e" opacity="0.6" />
            <circle cx="50" cy="-50" r="3" fill="#8b949e" opacity="0.6" />
            <circle cx="-50" cy="50" r="3" fill="#8b949e" opacity="0.6" />
            <circle cx="50" cy="50" r="3" fill="#8b949e" opacity="0.6" />

            <circle cx="0" cy="0" r="48" fill="none" stroke="#39c5cf" stroke-width="1.8" stroke-dasharray="4,3" />

            <circle cx="0" cy="0" r="16" fill="var(--surface-bg-solid)" stroke="#e3b341" stroke-width="2" />

            <line x1="-90" y1="0" x2="-115" y2="0" stroke="#8b949e" stroke-width="0.8" />
            <line x1="0" y1="-90" x2="-115" y2="-90" stroke="#8b949e" stroke-width="0.8" />
            <line x1="0" y1="90" x2="-115" y2="90" stroke="#8b949e" stroke-width="0.8" />
            <line
              x1="-105"
              y1="-86"
              x2="-105"
              y2="86"
              stroke="#58a6ff"
              stroke-width="1.5"
              marker-start="url(#arrow-cyan-drum)"
              marker-end="url(#arrow-cyan-drum)"
            />
            <rect x="-135" y="-12" width="60" height="24" rx="4" fill="#161b22" stroke="#58a6ff" stroke-width="1" />
            <text x="-105" y="4" fill="#58a6ff" font-size="11" font-weight="bold" text-anchor="middle">ツバ径</text>

            <line x1="34" y1="-34" x2="65" y2="-65" stroke="#39c5cf" stroke-width="1.2" marker-start="url(#arrow-cyan-drum)" />
            <line x1="65" y1="-65" x2="95" y2="-65" stroke="#39c5cf" stroke-width="1.2" />
            <rect x="95" y="-77" width="48" height="24" rx="4" fill="#161b22" stroke="#39c5cf" stroke-width="1" />
            <text x="119" y="-61" fill="#39c5cf" font-size="11" font-weight="bold" text-anchor="middle">胴径</text>

            <line x1="11" y1="11" x2="45" y2="45" stroke="#e3b341" stroke-width="1.2" marker-start="url(#arrow-cyan-drum)" />
            <line x1="45" y1="45" x2="75" y2="45" stroke="#e3b341" stroke-width="1.2" />
            <rect x="75" y="33" width="56" height="24" rx="4" fill="#161b22" stroke="#e3b341" stroke-width="1" />
            <text x="103" y="49" fill="#e3b341" font-size="11" font-weight="bold" text-anchor="middle">軸穴径</text>
          </g>

          <g transform="translate(480, 125)">
            <text x="0" y="-105" fill="#8b949e" font-size="12" font-weight="bold" text-anchor="middle">【側面断面図】</text>

            <line x1="-120" y1="0" x2="120" y2="0" stroke="#8b949e" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6" />

            <rect x="-85" y="-90" width="16" height="180" rx="2" fill="rgba(88, 166, 255, 0.12)" stroke="#58a6ff" stroke-width="1.8" />
            <rect x="69" y="-90" width="16" height="180" rx="2" fill="rgba(88, 166, 255, 0.12)" stroke="#58a6ff" stroke-width="1.8" />

            <rect x="-69" y="-48" width="138" height="96" fill="rgba(57, 197, 207, 0.08)" stroke="#39c5cf" stroke-width="1.8" />

            <rect x="-85" y="-16" width="170" height="32" fill="var(--surface-bg-solid)" stroke="#e3b341" stroke-width="1.5" stroke-dasharray="3,3" />

            <line x1="-69" y1="-48" x2="-69" y2="-75" stroke="#8b949e" stroke-width="0.8" />
            <line x1="69" y1="-48" x2="69" y2="-75" stroke="#8b949e" stroke-width="0.8" />
            <line
              x1="-65"
              y1="-68"
              x2="65"
              y2="-68"
              stroke="#a371f7"
              stroke-width="1.5"
              marker-start="url(#arrow-purple-drum)"
              marker-end="url(#arrow-purple-drum)"
            />
            <rect x="-24" y="-80" width="48" height="24" rx="4" fill="#161b22" stroke="#a371f7" stroke-width="1" />
            <text x="0" y="-64" fill="#a371f7" font-size="11" font-weight="bold" text-anchor="middle">内幅</text>

            <line x1="-85" y1="90" x2="-85" y2="115" stroke="#8b949e" stroke-width="0.8" />
            <line x1="85" y1="90" x2="85" y2="115" stroke="#8b949e" stroke-width="0.8" />
            <line
              x1="-81"
              y1="108"
              x2="81"
              y2="108"
              stroke="#58a6ff"
              stroke-width="1.5"
              marker-start="url(#arrow-cyan-drum)"
              marker-end="url(#arrow-cyan-drum)"
            />
            <rect x="-24" y="96" width="48" height="24" rx="4" fill="#161b22" stroke="#58a6ff" stroke-width="1" />
            <text x="0" y="112" fill="#58a6ff" font-size="11" font-weight="bold" text-anchor="middle">外幅</text>
          </g>
        </svg>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-item-gap">
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
        <p class="spec-desc">
          {{ item.desc }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.drum-diagram {
  width: 100%;
}

.diagram-svg-container {
  padding: var(--space-panel-pad-compact);
  border: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg-solid);
}

.diagram-svg-inner {
  width: 100%;
  max-width: 640px;
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
  min-width: 28px;
  height: 24px;
  padding: 0 var(--space-1);
  border-style: solid;
  border-width: var(--border-width-base);

  font-family: var(--font-base);
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
}
</style>
