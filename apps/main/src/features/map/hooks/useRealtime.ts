import type { RealtimeStatus } from "@truckmoov/api/lib/realtime-socket";
import {
  acquireRealtimeSocket,
  getRealtimeStatus,
  subscribeRealtimeStatus,
} from "@truckmoov/api/lib/realtime-socket";
import {
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

/**
 * Listen to one realtime event for the lifetime of the component.
 * The handler is read through a ref, so re-renders never stack listeners; unmount
 * removes this exact listener and releases the shared connection (last one out closes it).
 */
export function useRealtimeEvent<T>(event: string, handler: (payload: T) => void) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(
    () => {
      const {
        socket, release,
      } = acquireRealtimeSocket();
      const listener = (payload: T) => handlerRef.current(payload);
      socket.on(
        event,
        listener,
      );
      return () => {
        socket.off(
          event,
          listener,
        );
        release();
      };
    },
    [event],
  );
}

/** Connection state for the live indicator. Does not open a connection by itself. */
export function useRealtimeStatus(): RealtimeStatus {
  return useSyncExternalStore(
    subscribeRealtimeStatus,
    getRealtimeStatus,
  );
}
