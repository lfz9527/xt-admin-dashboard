const ALGORITHM = 'AES-GCM'
const IV_LENGTH = 12

export class EncryptionManager {
  private readonly secret: string

  constructor(secret: string) {
    this.secret = secret
  }

  private async getKey() {
    const secret = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(this.secret)
    )

    return crypto.subtle.importKey('raw', secret, ALGORITHM, false, [
      'encrypt',
      'decrypt',
    ])
  }

  async encrypt(value: string) {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
    const encrypted = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      await this.getKey(),
      new TextEncoder().encode(value)
    )

    return [this.toBase64(iv), this.toBase64(new Uint8Array(encrypted))].join(
      '.'
    )
  }

  async decrypt(value: string) {
    const [ivValue, encryptedValue] = value.split('.')
    if (!ivValue || !encryptedValue) {
      throw new Error('Invalid encrypted value')
    }

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: this.fromBase64(ivValue) },
      await this.getKey(),
      this.fromBase64(encryptedValue)
    )

    return new TextDecoder().decode(decrypted)
  }

  private toBase64(value: Uint8Array) {
    return btoa(String.fromCharCode(...value))
  }

  private fromBase64(value: string) {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
  }
}
