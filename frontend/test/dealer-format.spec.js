import test from 'node:test'
import assert from 'node:assert/strict'
import { dealerStatusText, dealerStatusType, formatBusinessDate, formatCurrency } from '../src/utils/dealer.js'

test('经销商业务状态使用稳定中文标签', () => {
  assert.equal(dealerStatusText('PENDING_REVIEW'), '待平台确认')
  assert.equal(dealerStatusText('SHIPPED'), '已发货')
  assert.equal(dealerStatusType('SUSPENDED'), 'danger')
  assert.equal(dealerStatusType('QUOTED'), 'warning')
})

test('金额与日期格式化不会直接暴露 ISO 字符串', () => {
  assert.match(formatCurrency(1180), /1,180\.00/)
  const date = formatBusinessDate('2026-09-09T01:29:52.000Z', true)
  assert.match(date, /^2026\/09\/09/)
  assert.doesNotMatch(date, /T|Z/)
})
