import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise component render output and event handlers without a browser or DOM.
// This is a hook double; real React/DOM integration still needs browser checks.
export async function componentHarness(path, name, imports, globals = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    },
  });
  const slots = [];
  let cursor = 0;
  let pendingEffects = [];
  const memo = (factory, deps) => {
    const index = cursor++;
    if (!slots[index] || deps.some((d, i) => !Object.is(d, slots[index].deps[i]))) {
      slots[index] = { value: factory(), deps };
    }
    return slots[index].value;
  };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => {
        slots[index] = typeof value === 'function' ? value(slots[index]) : value;
      }];
    },
    useRef: initial => memo(() => ({ current: initial }), []),
    useCallback: (callback, deps) => memo(() => callback, deps),
    useEffect(effect, deps) {
      memo(() => {
        const slot = { cleanup: undefined };
        pendingEffects.push(() => { slot.cleanup = effect(); });
        return slot;
      }, deps);
    },
  };
  const jsx = (type, props) => ({ type, props });
  const context = {
    exports: {}, console, Error,
    require(key) {
      if (key === 'react') return react;
      if (key === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (key === 'lucide-react') return new Proxy({}, { get: (_, key) => key });
      assert.ok(Object.hasOwn(imports, key), `Unexpected dependency: ${key}`);
      return imports[key];
    },
    ...globals,
  };
  vm.runInNewContext(outputText, context);
  return {
    render(props) {
      cursor = 0;
      const tree = context.exports[name](props);
      pendingEffects.splice(0).forEach(run => run());
      return tree;
    },
    unmount() { slots.forEach(slot => slot?.value?.cleanup?.()); },
  };
}

export function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}

export function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join('');
  return tree && typeof tree === 'object' ? text(tree.props?.children) : String(tree ?? '');
}

export function button(tree, label) {
  const found = nodes(tree).find(node => node.type === 'button' && text(node).includes(label));
  assert.ok(found, `Button missing: ${label}`);
  return found.props.onClick;
}
