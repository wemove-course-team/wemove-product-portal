import test from 'node:test';
import assert from 'node:assert';
import { formatSafeText } from '../src/utils/text.js';

test('formatSafeText: 将旧版 <br><br> 分段标签正确转换为 \n\n 换行符', () => {
  const legacyText = '从古代木建筑梁柱结构汲取灵感，坚持实木、无过多装饰<br><br>让家具回归实用与美感';
  const expected = '从古代木建筑梁柱结构汲取灵感，坚持实木、无过多装饰\n\n让家具回归实用与美感';
  assert.strictEqual(formatSafeText(legacyText), expected);
});

test('formatSafeText: 支持自闭合 <br/> 及带空格 <br /> 变体', () => {
  const input = '第一行<br/>第二行<br />第三行<BR>第四行';
  const expected = '第一行\n第二行\n第三行\n第四行';
  assert.strictEqual(formatSafeText(input), expected);
});

test('formatSafeText: 空值或无标签文本保持原样输出', () => {
  assert.strictEqual(formatSafeText(''), '');
  assert.strictEqual(formatSafeText(null), '');
  assert.strictEqual(formatSafeText('普通段落文本'), '普通段落文本');
});
