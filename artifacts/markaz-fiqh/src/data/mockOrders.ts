import { MOCK_CLASSES } from './mockClasses';

export type OrderStatus = 'pending' | 'success' | 'failed';

export type MockOrder = {
  id: string;
  user_name: string;
  user_email: string;
  class_id: string;
  class_title: string;
  amount: number;
  payment_method: string;
  status: OrderStatus;
  created_at: string;
};

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: 'ord-0012',
    user_name: 'Ahmad Fauzi',
    user_email: 'ahmad@example.com',
    class_id: 'fiqih-thaharah',
    class_title: MOCK_CLASSES.find((c) => c.id === 'fiqih-thaharah')?.title ?? 'Fiqih Thaharah',
    amount: 149000,
    payment_method: 'VA BCA',
    status: 'pending',
    created_at: '2026-07-04T09:15:00+07:00',
  },
  {
    id: 'ord-0013',
    user_name: 'Siti Rahmawati',
    user_email: 'siti.rahma@example.com',
    class_id: 'fiqih-muamalah',
    class_title: MOCK_CLASSES.find((c) => c.id === 'fiqih-muamalah')?.title ?? 'Fiqih Muamalah',
    amount: 249000,
    payment_method: 'QRIS',
    status: 'pending',
    created_at: '2026-07-04T11:42:00+07:00',
  },
  {
    id: 'ord-0014',
    user_name: 'Budi Santoso',
    user_email: 'budi.santoso@example.com',
    class_id: 'fiqih-nikah',
    class_title: MOCK_CLASSES.find((c) => c.id === 'fiqih-nikah')?.title ?? 'Fiqih Nikah',
    amount: 329000,
    payment_method: 'E-Wallet (GoPay)',
    status: 'pending',
    created_at: '2026-07-05T07:03:00+07:00',
  },
  {
    id: 'ord-0009',
    user_name: 'Nurul Hidayah',
    user_email: 'nurul.h@example.com',
    class_id: 'fiqih-shalat',
    class_title: MOCK_CLASSES.find((c) => c.id === 'fiqih-shalat')?.title ?? 'Fiqih Shalat',
    amount: 349000,
    payment_method: 'VA Mandiri',
    status: 'success',
    created_at: '2026-07-02T14:20:00+07:00',
  },
  {
    id: 'ord-0010',
    user_name: 'Rizky Pratama',
    user_email: 'rizky.p@example.com',
    class_id: 'fiqih-zakat',
    class_title: MOCK_CLASSES.find((c) => c.id === 'fiqih-zakat')?.title ?? 'Fiqih Zakat',
    amount: 199000,
    payment_method: 'Kartu Kredit',
    status: 'failed',
    created_at: '2026-07-03T18:55:00+07:00',
  },
  {
    id: 'ord-0011',
    user_name: 'Fatimah Azzahra',
    user_email: 'fatimah.az@example.com',
    class_id: 'fiqih-puasa',
    class_title: MOCK_CLASSES.find((c) => c.id === 'fiqih-puasa')?.title ?? 'Fiqih Puasa',
    amount: 179000,
    payment_method: 'VA BNI',
    status: 'success',
    created_at: '2026-07-01T10:10:00+07:00',
  },
];

export function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
