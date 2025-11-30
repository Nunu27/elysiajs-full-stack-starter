import { treaty } from '@elysiajs/eden';
import type { App } from 'vlab-backend/server';

const client = treaty<App>(window.location.origin);
export default client.api;
export const ws = client.ws;
