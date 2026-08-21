const fs = require('fs');

const filePath = 'app/assets/scss/foundation/_variables.scss';
let c = fs.readFileSync(filePath, 'utf8');

// The file consists of the top part (SCSS variables) and :root { ... }
const rootStartIndex = c.indexOf(':root {');
const topPart = c.substring(0, rootStartIndex + 7);
let rootContent = c.substring(rootStartIndex + 7, c.lastIndexOf('}'));
const bottomPart = '\n}\n';

// We will extract each section and reconstruct it in the ideal order.

function extractBlock(regex, content) {
  const match = content.match(regex);
  if (match) {
    // Remove it from content
    content = content.replace(match[0], '');
    return { block: match[0], remaining: content };
  }
  return { block: '', remaining: content };
}

// Extract specific blocks
let remaining = rootContent;
let typography, layoutSpacing, semanticGap, semanticPad, compSizes, iconSizes;
let colorBases, colorSemantics, components, borders, effects, shadows, reflexes;
let animations, iconArrow, responsiveTypo, responsiveSpace1024, responsiveSpace768;
let eachFont, eachZ, eachSpace, eachSize;

// Extractor helper
const ext = (pattern) => {
  const match = remaining.match(pattern);
  if (match) {
    remaining = remaining.replace(match[0], '');
    return match[0].trim() + '\n\n';
  }
  return '';
}

// 1. Primitives (each loops and base vars)
eachFont = ext(/  @each \$name, \$size in \$font-sizes \{[\s\S]*?\}/);
eachZ = ext(/  \/\/ --- Z-index ---\r?\n  @each \$name, \$value in \$z-index \{[\s\S]*?\}/);
eachSpace = ext(/  @each \$name, \$size in \$spacing-scale \{[\s\S]*?\}/);
eachSize = ext(/  @each \$name, \$size in \$size-scale \{[\s\S]*?\}/);

typography = ext(/  \/\/ --- Typography ---\r?\n[\s\S]*?(?=\r?\n  \/\/ --- Layout, Spacing & Sizing ---)/);
layoutSpacing = ext(/  \/\/ --- Layout, Spacing & Sizing ---\r?\n[\s\S]*?(?=\r?\n  \/\* Alias for nav to match AppGlobalNav.vue \*\/)/);
// Alias nav z-index
const aliasZ = ext(/  \/\* Alias for nav to match AppGlobalNav.vue \*\/\r?\n[^\r\n]*/);

colorBases = ext(/  \/\/ --- Colors \(Bases\) ---\r?\n[\s\S]*?(?=\r?\n  \/\/ --- Colors \(Applied\) ---)/);
borders = ext(/  \/\/ --- Borders ---\r?\n[\s\S]*?(?=\r?\n  \/\/ --- Effects & UI Elements ---)/);
effects = ext(/  \/\/ --- Effects & UI Elements ---\r?\n[\s\S]*?(?=\r?\n  \/\/ --- 1\. Elevation \(Physical Shadows\) ---)/);

compSizes = ext(/  \/\/ --- Component Specific Sizes ---\r?\n[\s\S]*?(?=\r?\n  \/\/ --- Icon Sizes ---)/);
iconSizes = ext(/  \/\/ --- Icon Sizes ---\r?\n[\s\S]*?(?=\r?\n)/);

// 2. Semantics
semanticGap = ext(/  \/\/ --- Semantic Spacing ---\r?\n  \/\/ --- Semantic Gap \(PC-First\) ---\r?\n[\s\S]*?(?=\r?\n  \/\/ --- Semantic Padding \(PC-First\) ---)/);
semanticPad = ext(/  \/\/ --- Semantic Padding \(PC-First\) ---\r?\n[\s\S]*?(?=\r?\n)/);

colorSemantics = ext(/  \/\/ --- Colors \(Applied\) ---\r?\n[\s\S]*?(?=\r?\n  \/\/ --- Components ---)/);
components = ext(/  \/\/ --- Components ---\r?\n[\s\S]*?(?=\r?\n)/);

shadows = ext(/  \/\/ --- 1\. Elevation \(Physical Shadows\) ---\r?\n[\s\S]*?(?=\r?\n  \/\/ --- 2\. Edge Reflex \(Glass Highlights\) ---)/);
reflexes = ext(/  \/\/ --- 2\. Edge Reflex \(Glass Highlights\) ---\r?\n[\s\S]*?(?=\r?\n  \/\/ --- 3\. Animation & Transition ---)/);

animations = ext(/  \/\/ --- 3\. Animation & Transition ---\r?\n[\s\S]*?(?=\r?\n  --icon-select-arrow)/);
iconArrow = ext(/  --icon-select-arrow:[^\r\n]*/);

// 4. Overrides
responsiveTypo = ext(/  \/\* Responsive Typography \(Fluid Scale\) \*\/\r?\n  @media \(width >= 1600px\) \{[\s\S]*?(?=\r?\n  @media \(width <= 1024px\) \{\r?\n    --gap-section:)/);
responsiveSpace1024 = ext(/  @media \(width <= 1024px\) \{\r?\n    --gap-section:[\s\S]*?(?=\r?\n  @media \(width <= 768px\) \{\r?\n    --gap-component:)/);
responsiveSpace768 = ext(/  @media \(width <= 768px\) \{\r?\n    --gap-component:[\s\S]*?\}/);

// Reconstruct
const newRoot = `
  // ==========================================================================
  // 1. PRIMITIVES (Base Dictionaries & Scales)
  // ==========================================================================
  
  // --- Auto-generated Scales (Space, Size, Font-size, Z-index) ---
  ${eachSpace.trim()}

  ${eachSize.trim()}

  ${eachFont.trim()}

  ${eachZ.replace('// --- Z-index ---', '').trim()}

  // --- Typography Base ---
  ${typography.replace('// --- Typography ---', '').trim()}

  // --- Layout & Spacing Base ---
  ${layoutSpacing.replace('// --- Layout, Spacing & Sizing ---', '').trim()}

  // --- Color Base (HSL Values) ---
  ${colorBases.replace('// --- Colors (Bases) ---', '').trim()}

  // --- Borders Base ---
  ${borders.replace('// --- Borders ---', '').trim()}

  // --- Effects Base (Blurs & Overlays) ---
  ${effects.replace('// --- Effects & UI Elements ---', '').trim()}

  // ==========================================================================
  // 2. SEMANTICS (Meaningful Aliases)
  // ==========================================================================

  // --- Semantic Colors ---
  ${colorSemantics.replace('// --- Colors (Applied) ---', '').trim()}

  // --- Component Colors ---
  ${components.replace('// --- Components ---', '').trim()}

  // --- Semantic Spacing (Gap & Pad) ---
  ${semanticGap.replace('// --- Semantic Spacing ---', '').trim()}
  ${semanticPad.trim()}

  // --- Shadows & Edge Reflexes ---
  ${shadows.replace('// --- 1. Elevation (Physical Shadows) ---', '').trim()}

  ${reflexes.replace('// --- 2. Edge Reflex (Glass Highlights) ---', '').trim()}

  // --- Animation & Transitions ---
  ${animations.replace('// --- 3. Animation & Transition ---', '').trim()}

  // ==========================================================================
  // 3. COMPONENT SPECIFIC (Micro Adjustments)
  // ==========================================================================

  // --- Component & Icon Sizes ---
  ${compSizes.replace('// --- Component Specific Sizes ---', '').trim()}

  ${iconSizes.replace('// --- Icon Sizes ---', '').trim()}

  // --- Z-index Aliases ---
  ${aliasZ.trim()}

  // --- UI Icons ---
  ${iconArrow.trim()}

  // ==========================================================================
  // 4. RESPONSIVE OVERRIDES (Media Queries)
  // ==========================================================================

  // --- Typography Overrides ---
  ${responsiveTypo.trim()}

  // --- Spacing Overrides ---
  ${responsiveSpace1024.trim()}

  ${responsiveSpace768.trim()}
`;

fs.writeFileSync(filePath, topPart + newRoot + bottomPart, 'utf8');
