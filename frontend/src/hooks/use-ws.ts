import { ws } from '@frontend/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { authQueryOptions } from './use-auth';

type WebSocketClient = Awaited<ReturnType<typeof ws.subscribe>>;
type WSPayload = Parameters<WebSocketClient['send']>[0];

// =================================================================
// SECTION: Type Utilities for Extracting WS Event Types
// =================================================================

// Extract all possible event names from the union
type AllEventNames = WSPayload extends { event: infer E } ? E : never;

// Extract events that are subscribable (appears in subscribe body event field)
type SubscribableEventName = Extract<
    WSPayload,
    { event: 'subscribe' }
>['body'] extends { event: infer E } ? E : never;

// Extract parameters for a specific event name
type ExtractEventParams<TEventName extends SubscribableEventName> = Extract<
    WSPayload,
    { event: 'subscribe'; body: { event: TEventName } }
>['body'] extends { params: infer P }
    ? P
    : undefined;

// Check if an event has parameters
type HasParams<TEventName extends SubscribableEventName> =
    ExtractEventParams<TEventName> extends undefined ? false : true;

type MessageHandler<T = unknown> = (data: T) => void;

interface Subscription {
    eventName: string;
    params?: Record<string, string>;
    handlers: Set<MessageHandler>;
}

// =================================================================
// SECTION: Hook Implementation
// =================================================================

function useWS() {
    const client = useRef<WebSocketClient | null>(null);
    const subscriptions = useRef<Map<string, Subscription>>(new Map());
    const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);
    
    const authQuery = useQuery(authQueryOptions);
    const loggedIn = Boolean(authQuery.data);

    // Create a stable message handler
    useEffect(() => {
        messageHandlerRef.current = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                
                // Handle error messages
                if (data.error) {
                    console.error('[WebSocket Error]:', data.error);
                    return;
                }

                // Find matching subscription and call all handlers
                for (const subscription of subscriptions.current.values()) {
                    subscription.handlers.forEach((handler) => {
                        try {
                            handler(data);
                        } catch (error) {
                            console.error('[WebSocket Handler Error]:', error);
                        }
                    });
                }
            } catch (error) {
                console.error('[WebSocket Parse Error]:', error);
            }
        };
    }, []);

    // Initialize WebSocket connection
    useEffect(() => {
        const subs = subscriptions.current;
        const clientRef = client;
        
        if (loggedIn && !clientRef.current) {
            clientRef.current = ws.subscribe();

            if (messageHandlerRef.current) {
                clientRef.current.subscribe(messageHandlerRef.current);
            }
        }

        return () => {
            const currentClient = clientRef.current;
            
            if (currentClient) {
                subs.clear();
                currentClient.close();
                clientRef.current = null;
            }
        };
    }, [loggedIn]);

    const subscribe = useCallback(<TEventName extends SubscribableEventName>(
        ...args: HasParams<TEventName> extends true
            ? [
                  eventName: TEventName,
                  handler: MessageHandler<unknown>,
                  params: ExtractEventParams<TEventName>
              ]
            : [eventName: TEventName, handler: MessageHandler<unknown>, params?: undefined]
    ) => {
        if (!client.current) {
            console.warn('[WebSocket] Client not initialized');
            return () => {};
        }

        const [eventName, handler, params] = args;
        const subscriptionKey = params
            ? `${eventName}:${JSON.stringify(params)}`
            : eventName;

        let subscription = subscriptions.current.get(subscriptionKey);

        if (!subscription) {
            subscription = {
                eventName,
                params: params as Record<string, string> | undefined,
                handlers: new Set(),
            };
            subscriptions.current.set(subscriptionKey, subscription);

            try {
                const body = params
                    ? { event: eventName, params }
                    : { event: eventName };
                
                client.current.send({ event: 'subscribe', body } as never);
            } catch (error) {
                console.error('[WebSocket Subscribe Error]:', error);
            }
        }

        subscription.handlers.add(handler as MessageHandler);

        // Return unsubscribe function
        return () => {
            const sub = subscriptions.current.get(subscriptionKey);
            if (!sub) return;

            sub.handlers.delete(handler as MessageHandler);

            // If no more handlers, unsubscribe from server
            if (sub.handlers.size === 0) {
                subscriptions.current.delete(subscriptionKey);

                try {
                    const body = params
                        ? { event: eventName, params }
                        : { event: eventName };
                    
                    client.current?.send({ event: 'unsubscribe', body } as never);
                } catch (error) {
                    console.error('[WebSocket Unsubscribe Error]:', error);
                }
            }
        };
    }, []);

    const send = useCallback(<T extends WSPayload>(payload: T) => {
        if (!client.current) {
            console.warn('[WebSocket] Client not initialized');
            return;
        }

        try {
            client.current.send(payload);
        } catch (error) {
            console.error('[WebSocket Send Error]:', error);
        }
    }, []);

    const isConnected = useCallback(() => {
        return client.current !== null;
    }, []);

    return {
        subscribe,
        send,
        isConnected,
    };
}

export { useWS };
export type { AllEventNames, MessageHandler, SubscribableEventName, WSPayload };

