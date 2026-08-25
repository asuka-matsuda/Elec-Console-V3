const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const syntax = require('postcss-scss');

const categories = [
  { name: 'SCSS変数・マップ', test: node => node.type === 'decl' && node.prop.startsWith('$') },
  { name: 'CSSカスタムプロパティ', test: node => node.type === 'decl' && node.prop.startsWith('--') },
  { name: '継承', test: node => (node.type === 'atrule' && node.name === 'extend') },
  { name: 'レイアウト・配置', test: node => {
      if (node.type === 'decl') {
        const prop = node.prop;
        return ['position', 'top', 'right', 'bottom', 'left', 'z-index', 'display', 'flex', 'flex-direction', 'flex-wrap', 'flex-shrink', 'flex-grow', 'justify-content', 'align-items', 'gap', 'grid', 'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row', 'order', 'container-type', 'container-name'].includes(prop);
      }
      if (node.type === 'atrule' && node.name === 'include') {
        return node.params.startsWith('flex') || node.params.startsWith('grid') || node.params.includes('flex-between') || node.params.includes('flex-start') || node.params.includes('flex-center');
      }
      return false;
  }},
  { name: 'その他', test: node => node.type === 'decl' && ['overflow', 'overflow-y', 'overflow-x', 'cursor', 'pointer-events', 'user-select', 'appearance', 'clip-path', 'visibility'].includes(node.prop) },
  { name: 'ボックスモデル', test: node => node.type === 'decl' && ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-color', 'border-width', 'border-style', 'border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius', 'box-sizing', 'outline'].includes(node.prop) },
  { name: 'タイポグラフィ', test: node => node.type === 'decl' && ['color', 'font', 'font-size', 'font-weight', 'font-family', 'line-height', 'text-align', 'white-space', 'text-transform', 'text-decoration', 'letter-spacing', 'word-break', 'overflow-wrap', '-webkit-line-clamp', '-webkit-box-orient'].includes(node.prop) },
  { name: '視覚効果', test: node => {
      if (node.type === 'decl') {
        return ['background', 'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat', 'box-shadow', 'opacity', 'filter', 'backdrop-filter', 'transform', 'transition', 'animation', 'fill', 'stroke'].includes(node.prop);
      }
      if (node.type === 'atrule' && node.name === 'include') {
        return node.params.includes('cyber-text-glow') || node.params.includes('state-base') || node.params.includes('surface');
      }
      return false;
  }},
  { name: '疑似要素', test: node => node.type === 'rule' && (node.selector.includes('::') || node.selector.includes('::-')) },
  { name: '疑似クラス', test: node => node.type === 'rule' && node.selector.includes(':') && !node.selector.includes('::') && !node.selector.includes(':slotted') },
  { name: 'モディファイア', test: node => node.type === 'rule' && (node.selector.includes('.is-') || node.selector.includes('.has-') || node.selector.includes('--')) },
  { name: '子要素', test: node => node.type === 'rule' && (node.selector.includes('__') || node.selector.includes('>') || node.selector.includes('svg') || node.selector.includes(':slotted') || /^[a-z]+$/.test(node.selector.trim().replace(/^& /, ''))) },
  { name: 'メディアクエリ', test: node => node.type === 'atrule' && (node.name === 'mq' || node.name === 'cq' || node.name === 'media') },
  { name: 'キーフレーム', test: node => node.type === 'atrule' && node.name === 'keyframes' }
];

const plugin = postcss.plugin('add-comments', () => {
  return (root) => {
    root.walkComments(comment => {
      if (comment.text.trim().startsWith('---') && comment.text.trim().endsWith('---')) {
        comment.remove();
      }
    });

    root.walk(container => {
      if (container.nodes && container.nodes.length > 0) {
        let currentCategory = null;

        for (let i = 0; i < container.nodes.length; i++) {
          const node = container.nodes[i];
          if (node.type === 'comment') continue;
          
          let matchedCategory = null;
          for (const cat of categories) {
            if (cat.test(node)) {
              matchedCategory = cat.name;
              break;
            }
          }

          if (matchedCategory && matchedCategory !== currentCategory) {
            const comment = postcss.comment({ text: ` --- ${matchedCategory} --- ` });
            const indentMatch = node.raws.before ? node.raws.before.match(/\n(\s*)$/) : null;
            const indent = indentMatch ? indentMatch[1] : '  ';
            
            let prefix = i === 0 ? '\n' : '\n\n';
            comment.raws.before = prefix + indent;
            node.raws.before = '\n' + indent;
            
            container.insertBefore(node, comment);
            currentCategory = matchedCategory;
            i++; 
          }
        }
      }
    });
  };
});

async function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const styleMatch = content.match(/<style scoped lang="scss">([\s\S]*?)<\/style>/);
  if (!styleMatch) return;

  const scssContent = styleMatch[1];
  try {
    const result = await postcss([plugin()]).process(scssContent, { syntax });
    const newContent = content.substring(0, styleMatch.index) + 
      '<style scoped lang="scss">\n' + result.css.trim() + '\n</style>' +
      content.substring(styleMatch.index + styleMatch[0].length);
      
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Processed', filePath);
  } catch (err) {
    console.error('Error processing', filePath, err);
  }
}

function getFiles(dir, ext) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        let fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) { 
            results = results.concat(getFiles(fullPath, ext));
        } else { 
            if (file.endsWith(ext)) results.push(fullPath);
        }
    });
    return results;
}

const files = getFiles('app/components', '.vue').concat(getFiles('app/pages', '.vue'), getFiles('app/layouts', '.vue'));
files.forEach(processFile);
