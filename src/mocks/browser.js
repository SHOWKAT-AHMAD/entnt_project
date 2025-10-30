import { setupWorker } from 'msw'
import { handlers } from './handlers'

const worker = setupWorker(...handlers)

export async function initMocks() {
  try {
    await worker.start({
      onUnhandledRequest: 'warn'
    })
    console.log('🔶 Mock Service Worker started')
  } catch (error) {
    console.error('❌ Mock Service Worker failed to start:', error)
  }
}
