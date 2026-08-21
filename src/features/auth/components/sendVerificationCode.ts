const MOCK_SEND_CODE_DELAY = 10_000 // 调试用模拟接口，等待 10 秒后返回发送成功

export default function sendVerificationCode(email: string) {
  return new Promise<boolean>((resolve) => {
    setTimeout(() => resolve(Boolean(email)), MOCK_SEND_CODE_DELAY)
  })
}
