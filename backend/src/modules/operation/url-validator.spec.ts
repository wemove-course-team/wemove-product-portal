import { isValidUrlOrPath } from './url-validator'

describe('url-validator（单元）', () => {
  it('正常相对路径与 http(s) 外链通过', () => {
    expect(isValidUrlOrPath('/images/a.jpg')).toBe(true)
    expect(isValidUrlOrPath('/products')).toBe(true)
    expect(isValidUrlOrPath('http://example.com/a.png')).toBe(true)
    expect(isValidUrlOrPath('https://example.com/a.png')).toBe(true)
    expect(isValidUrlOrPath('')).toBe(true) // 空串 = 未设置
  })

  it('危险协议被拒绝', () => {
    expect(isValidUrlOrPath('javascript:alert(1)')).toBe(false)
    expect(isValidUrlOrPath('ftp://example.com/a.png')).toBe(false)
    expect(isValidUrlOrPath('data:text/html,x')).toBe(false)
  })

  it('含反斜杠的路径被拒绝（禁止浏览器按跨域 URL 解析）', () => {
    expect(isValidUrlOrPath('/\\evil.example/path')).toBe(false)
    expect(isValidUrlOrPath('/images\\..\\evil')).toBe(false)
    expect(isValidUrlOrPath('https://example.com\\@evil.example')).toBe(false)
  })
})
