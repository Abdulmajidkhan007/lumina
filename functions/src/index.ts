/**
 * Lumina Cloud Functions.
 *
 * onBroadcastCreated — when an admin publishes `broadcasts/{id}` (rules allow
 * admins only), send one FCM message to the 'all' topic. The app subscribes
 * every signed-in device to that topic (src/services/push.ts →
 * subscribeToBroadcasts). Requires the Blaze plan; no keys live in the repo —
 * the function runs with the project's default service account.
 */
import { initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

initializeApp();

const TOPIC = 'all';
const PUSH_BODY_MAX = 180;

export const onBroadcastCreated = onDocumentCreated(
  { document: 'broadcasts/{broadcastId}', region: 'us-central1' },
  async (event) => {
    const data = event.data?.data();
    const title: unknown = data?.title;
    const body: unknown = data?.body;
    if (typeof title !== 'string' || typeof body !== 'string') {
      logger.warn('broadcast without title/body, skipping push', { id: event.params.broadcastId });
      return;
    }
    const link: unknown = data?.link;
    const text = body.length > PUSH_BODY_MAX ? `${body.slice(0, PUSH_BODY_MAX - 1)}…` : body;
    const messageId = await getMessaging().send({
      topic: TOPIC,
      notification: { title, body: text },
      data: {
        type: 'broadcast',
        broadcastId: event.params.broadcastId,
        ...(typeof link === 'string' ? { link } : {}),
      },
      android: { priority: 'high' },
    });
    logger.info('broadcast pushed', { id: event.params.broadcastId, messageId });
  },
);
