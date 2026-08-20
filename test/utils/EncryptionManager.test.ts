import { EncryptionManager } from '@/utils/EncryptionManager'

describe('EncryptionManager', () => {
  const manager = new EncryptionManager('test-secret')

  it('encrypts and decrypts values', async () => {
    const encrypted = await manager.encrypt('hello')

    await expect(manager.decrypt(encrypted)).resolves.toBe('hello')
  })

  it('uses a different initialization vector for each encryption', async () => {
    const first = await manager.encrypt('hello')
    const second = await manager.encrypt('hello')

    expect(first).not.toBe(second)
  })

  it('rejects tampered values', async () => {
    const encrypted = await manager.encrypt('hello')
    const [iv, value] = encrypted.split('.')
    const tampered = `${iv}.${value.slice(0, -1)}${value.endsWith('A') ? 'B' : 'A'}`

    await expect(manager.decrypt(tampered)).rejects.toThrow()
  })
})
