import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function createBranchSocket(branchId: string): Socket {
  return io(WS_URL, {
    query: { branchId },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
  });
}

export function createCustomerSocket(customerId: string): Socket {
  return io(WS_URL, {
    query: { customerId },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
  });
}
