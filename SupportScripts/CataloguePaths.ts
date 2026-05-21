import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentsDir = path.join(__dirname, '..', 'src', 'components');

function findMatchingComponents(dir: string, basePath: string = 'components'): string[] {
  const results: string[] = [];
  
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      const relativePath = path.join(basePath, item.name);
      
      if (item.isDirectory()) {
        results.push(...findMatchingComponents(fullPath, relativePath));
      } else if (item.isFile() && item.name.endsWith('.tsx')) {
        const fileName = path.parse(item.name).name;
        const parentFolder = path.basename(dir);
        
        if (fileName === parentFolder) {
          results.push(relativePath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return results;
}

const matchingPaths = findMatchingComponents(componentsDir);

console.log('\nMatching component paths:\n');
matchingPaths.forEach(p => console.log(p));
console.log(`\nTotal: ${matchingPaths.length} components found\n`);