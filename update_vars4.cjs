const fs = require('fs');

let c = fs.readFileSync('app/assets/scss/foundation/_variables.scss', 'utf8');

c = c.replace(/--gap-component:\s*var\(--space-2\);\s*--gap-element:\s*var\(--space-2\);\s*--gap-section:\s*var\(--space-3\);\s*--pad-container:\s*var\(--space-3\);/, 
  `// --- Semantic Gap (PC-First) ---
  --gap-element: var(--space-1);
  --gap-component: var(--space-2);
  --gap-section: var(--space-3);

  // --- Semantic Padding (PC-First) ---
  --pad-element: var(--space-1);
  --pad-component: var(--space-2);
  --pad-section: var(--space-3);
  --pad-container: var(--space-4);`);

c = c.replace(/@media \(width <= 1024px\) \{\s*--gap-section: var\(--space-4\);\s*--pad-container: var\(--space-3\);\s*\}/,
`@media (width <= 1024px) {
    --gap-section: var(--space-3);
    --pad-section: var(--space-3);
    --pad-container: var(--space-3);
  }`);

c = c.replace(/@media \(width <= 768px\) \{\s*--gap-component: var\(--space-2\);\s*--gap-section: var\(--space-3\);\s*--pad-container: var\(--space-2\);\s*\}/,
`@media (width <= 768px) {
    --gap-component: var(--space-1);
    --gap-section: var(--space-2);
    --pad-component: var(--space-1);
    --pad-section: var(--space-2);
    --pad-container: var(--space-2);
  }`);

fs.writeFileSync('app/assets/scss/foundation/_variables.scss', c, 'utf8');
