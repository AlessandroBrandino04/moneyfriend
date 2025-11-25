import { publishNotification } from './client';

/**
 * Convenience wrapper to send a notification (fire-and-forget).
 * Usage: sendNotification('FRIEND_REQUEST', { ...payload })
 */
export function sendNotification(type: string, payload: any): void {
  try {
    // fire-and-forget; log failures
    publishNotification({ type, payload }).catch((e: any) => {
      console.debug('Notify failed', e);
    });
  } catch (e) {
    console.debug('Notify wrapper error', e);
  }
}

export default { sendNotification };
