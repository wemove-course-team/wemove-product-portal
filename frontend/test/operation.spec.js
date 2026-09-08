import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_SITE_CONFIG,
  messageStatusOptions,
  normalizeSiteConfig,
  toBannerSortItems
} from '../src/utils/operation.js'

test('normalizeSiteConfig 只保留白名单字符串并补齐默认 Logo', () => {
  const value = normalizeSiteConfig({ siteName: '测试站点', logoUrl: '', evilKey: 'ignored' })
  assert.equal(value.siteName, '测试站点')
  assert.equal(value.logoUrl, DEFAULT_SITE_CONFIG.logoUrl)
  assert.equal(Object.hasOwn(value, 'evilKey'), false)
  assert.equal(Object.keys(value).length, 7)
})

test('toBannerSortItems 生成整数排序并拒绝重复 ID', () => {
  assert.deepEqual(toBannerSortItems([{ id: '2', sortOrder: '7' }]), [{ id: 2, sortOrder: 7 }])
  assert.throws(
    () => toBannerSortItems([{ id: 1, sortOrder: 1 }, { id: 1, sortOrder: 2 }]),
    /排序数据无效/
  )
})

test('messageStatusOptions 只返回当前状态和合法下一状态', () => {
  assert.deepEqual(messageStatusOptions('PENDING').map((item) => item.value), ['PENDING', 'PROCESSING'])
  assert.deepEqual(messageStatusOptions('PROCESSING').map((item) => item.value), ['PROCESSING', 'DONE'])
  assert.deepEqual(messageStatusOptions('DONE').map((item) => item.value), ['DONE'])
})
