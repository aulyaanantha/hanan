import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

function harness() {
  const values = []; let index = 0; let errorState = {}; const submissions = [];
  const exports = {};
  const loginAction = async (_previous, data) => { submissions.push(data); return { error: 'invalid' }; };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/LoginForm.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => {
    if (name === 'react') return {
      useState: initial => { const slot = index++; if (!(slot in values)) values[slot] = initial; return [values[slot], value => { values[slot] = value; }]; },
      useActionState: action => [errorState, async data => { errorState = await action(errorState, data); }],
    };
    if (name === '@/app/login/actions') return { loginAction };
    if (name.startsWith('./Login')) return { default: () => null };
    return require(name);
  } });
  return { submissions, render() { index = 0; return exports.default({}); } };
}
function inputs(element, result = {}) {
  if (!element || typeof element !== 'object') return result;
  if (element.type === 'input') result[element.props.name] = element.props;
  for (const child of [element.props?.children].flat(Infinity)) inputs(child, result);
  return result;
}
test('both credentials survive a rejected submission and can be corrected for retry', async () => {
  const form = harness();
  let fields = inputs(form.render());
  fields.email.onChange({ target: { value: 'typo@example.com' } });
  fields.password.onChange({ target: { value: '123456' } });
  let tree = form.render(); fields = inputs(tree);
  await tree.props.action(new Map([['email', fields.email.value], ['password', fields.password.value]]));
  tree = form.render(); fields = inputs(tree);
  assert.equal(fields.email.value, 'typo@example.com');
  assert.equal(fields.password.value, '123456');
  assert.equal(fields.password.type, 'password');
  assert.equal(fields.password.inputMode, 'numeric');
  assert.equal(fields.password['aria-describedby'], 'login-error');
  fields.email.onChange({ target: { value: 'correct@example.com' } });
  fields = inputs(form.render());
  assert.equal(fields.email.value, 'correct@example.com');
  assert.equal(fields.password.value, '123456');
  assert.equal(form.submissions.length, 1);
});
