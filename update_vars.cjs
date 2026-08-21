const fs = require('fs');

let c = fs.readFileSync('app/assets/scss/foundation/_variables.scss', 'utf8');

c = c.replace(
/  --gap-component: var\(--space-2\);\n  --gap-element: var\(--space-2\);\n  --gap-section: var\(--space-3\);\n  --pad-container: var\(--space-3\);/m,
`  // --- Semantic Gap (PC-First) ---
  --gap-element: var(--space-1);
  --gap-component: var(--space-2);
  --gap-section: var(--space-3);

  // --- Semantic Padding (PC-First) ---
  --pad-element: var(--space-1);
  --pad-component: var(--space-2);
  --pad-section: var(--space-3);
  --pad-container: var(--space-4);`
);

// Update media queries
c = c.replace(
/  @media \(width <= 1024px\) \{\n    --gap-section: var\(--space-4\);\n    --pad-container: var\(--space-3\);\n  \}/m,
`  @media (width <= 1024px) {
    --gap-section: var(--space-3);
    --pad-section: var(--space-3);
    --pad-container: var(--space-3);
  }`
);

c = c.replace(
/  @media \(width <= 768px\) \{\n    --gap-component: var\(--space-2\);\n    --gap-section: var\(--space-3\);\n    --pad-container: var\(--space-2\);\n  \}/m,
`  @media (width <= 768px) {
    --gap-component: var(--space-1);
    --gap-section: var(--space-2);
    --pad-component: var(--space-1);
    --pad-section: var(--space-2);
    --pad-container: var(--space-2);
  }`
);

fs.writeFileSync('app/assets/scss/foundation/_variables.scss', c, 'utf8');
