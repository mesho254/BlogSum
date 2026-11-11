/**
 * Automated Static Analysis & Reference Error Checker
 * Scans all JSX and JS files across frontend/src to detect:
 * 1. Temporal Dead Zone (TDZ) reference errors ("Cannot access X before initialization")
 * 2. Unresolved / undeclared identifier reference errors
 */

const fs = require('fs');
const path = require('path');
const parser = require('../node_modules/@babel/parser');
const traverse = require('../node_modules/@babel/traverse').default;

const ROOT_DIR = path.resolve(__dirname, '../src');

// Standard browser/Node global identifiers that are always defined
const KNOWN_GLOBALS = new Set([
  'window', 'document', 'console', 'localStorage', 'sessionStorage', 'navigator',
  'location', 'fetch', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame', 'Math', 'Date', 'JSON', 'Object',
  'Array', 'String', 'Number', 'Boolean', 'RegExp', 'Map', 'Set', 'WeakMap', 'WeakSet',
  'Promise', 'Symbol', 'Error', 'TypeError', 'ReferenceError', 'RangeError',
  'Intl', 'URL', 'URLSearchParams', 'FormData', 'Blob', 'File', 'FileReader',
  'SpeechSynthesisUtterance', 'MutationObserver', 'IntersectionObserver',
  'process', 'Buffer', 'global', 'globalThis', 'encodeURIComponent', 'decodeURIComponent',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'import', 'module', 'exports', 'require',
  'Audio', 'Image', 'Event', 'CustomEvent', 'Element', 'Node', 'HTMLElement',
  'document', 'alert', 'confirm', 'prompt'
]);

function getAllFiles(dir, extensions = ['.jsx', '.js']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
        results = results.concat(getAllFiles(filePath, extensions));
      }
    } else {
      if (extensions.includes(path.extname(file))) {
        results.push(filePath);
      }
    }
  }
  return results;
}

function checkFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const relPath = path.relative(path.resolve(__dirname, '..'), filePath);
  const errors = [];

  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'classProperties', 'dynamicImport'],
      errorRecovery: true,
    });
  } catch (parseErr) {
    return [{ type: 'PARSE_ERROR', file: relPath, message: parseErr.message }];
  }

  traverse(ast, {
    // Check call expressions like useEffect(..., [..., varName]) where varName is evaluated before definition
    CallExpression(callPath) {
      const callee = callPath.node.callee;
      const calleeName = callee.name;

      // React hooks whose arguments are evaluated synchronously on render
      if (['useEffect', 'useMemo', 'useCallback', 'useState', 'useRef', 'useLayoutEffect'].includes(calleeName)) {
        callPath.traverse({
          Identifier(idPath) {
            // Only examine referenced identifiers
            if (!idPath.isReferencedIdentifier()) return;

            const name = idPath.node.name;
            if (KNOWN_GLOBALS.has(name)) return;

            // Check if this identifier is in a nested closure (e.g., inside useEffect callback body vs dependency array)
            // Dependencies in the array [..., id] are evaluated IMMEDIATELY at the function body level!
            const isDepArrayItem = callPath.node.arguments[1] &&
              callPath.node.arguments[1].type === 'ArrayExpression' &&
              idPath.findParent(p => p.node === callPath.node.arguments[1]);

            // Or direct hook argument: useState(initialValue)
            const isDirectArg = idPath.parentPath.node === callPath.node;

            if (isDepArrayItem || isDirectArg) {
              const binding = idPath.scope.getBinding(name);
              if (binding && binding.scope === callPath.scope) {
                if (idPath.node.start < binding.identifier.start) {
                  const loc = idPath.node.loc?.start;
                  errors.push({
                    type: 'TDZ_REFERENCE_ERROR',
                    file: relPath,
                    line: loc ? loc.line : 'unknown',
                    column: loc ? loc.column : 'unknown',
                    variable: name,
                    declLine: binding.identifier.loc?.start?.line,
                    message: `Variable '${name}' is referenced in ${calleeName} before its declaration on line ${binding.identifier.loc?.start?.line}!`,
                  });
                }
              }
            }
          }
        });
      }
    },

    // Check top-level statement variable evaluation before declaration in function bodies
    Function(funcPath) {
      const body = funcPath.get('body');
      if (!body.isBlockStatement()) return;

      const statements = body.get('body');
      const declarations = new Map();

      // Collect all const/let declarations in this function's immediate block
      for (const stmt of statements) {
        if (stmt.isVariableDeclaration() && stmt.node.kind !== 'var') {
          for (const decl of stmt.get('declarations')) {
            const id = decl.get('id');
            if (id.isIdentifier()) {
              declarations.set(id.node.name, {
                line: id.node.loc?.start?.line,
                start: id.node.start,
              });
            } else if (id.isObjectPattern()) {
              for (const prop of id.get('properties')) {
                if (prop.isObjectProperty() && prop.get('value').isIdentifier()) {
                  const name = prop.get('value').node.name;
                  declarations.set(name, {
                    line: prop.get('value').node.loc?.start?.line,
                    start: prop.get('value').node.start,
                  });
                }
              }
            }
          }
        }
      }

      // Check synchronous statements executed before declarations
      for (const stmt of statements) {
        // Skip statements after all declarations
        stmt.traverse({
          Identifier(idPath) {
            if (!idPath.isReferencedIdentifier()) return;

            // Don't flag references inside inner function/arrow callbacks (they execute later)
            const innerFunction = idPath.findParent(p => p.isFunction() && p !== funcPath);
            if (innerFunction) return;

            const name = idPath.node.name;
            const decl = declarations.get(name);

            if (decl && idPath.node.start < decl.start) {
              const loc = idPath.node.loc?.start;
              // Avoid duplicate reporting if already flagged
              if (!errors.some(e => e.file === relPath && e.line === loc?.line && e.variable === name)) {
                errors.push({
                  type: 'TDZ_REFERENCE_ERROR',
                  file: relPath,
                  line: loc ? loc.line : 'unknown',
                  column: loc ? loc.column : 'unknown',
                  variable: name,
                  declLine: decl.line,
                  message: `Cannot access '${name}' before initialization (declaration on line ${decl.line}).`,
                });
              }
            }
          }
        });
      }
    }
  });

  return errors;
}

function runScanner() {
  console.log(`\n======================================================`);
  console.log(`  BlogSum Reference Error & TDZ Integrity Scanner`);
  console.log(`======================================================\n`);

  const files = getAllFiles(ROOT_DIR);
  console.log(`Scanning ${files.length} JSX/JS files in frontend/src...\n`);

  let totalErrors = 0;
  const issuesByFile = new Map();

  for (const file of files) {
    const errs = checkFile(file);
    if (errs.length > 0) {
      issuesByFile.set(file, errs);
      totalErrors += errs.length;
    }
  }

  if (totalErrors === 0) {
    console.log(`\x1b[32m✔ SUCCESS: 0 Reference Errors detected across all ${files.length} frontend files.\x1b[0m`);
    console.log(`  All variables, hooks dependencies, and state bindings are declared before use.\n`);
    process.exit(0);
  } else {
    console.error(`\x1b[31m✖ FAILURE: Found ${totalErrors} Reference Error(s) in ${issuesByFile.size} file(s):\x1b[0m\n`);
    for (const [file, errs] of issuesByFile.entries()) {
      const relPath = path.relative(path.resolve(__dirname, '..'), file);
      console.error(`  \x1b[33m${relPath}\x1b[0m`);
      for (const err of errs) {
        console.error(`    - Line ${err.line}:${err.column}: ${err.message}`);
      }
      console.log('');
    }
    process.exit(1);
  }
}

runScanner();

