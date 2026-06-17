import { writeFile } from 'node:fs/promises';
import { renderNotificationHtml } from '../src/lib/notify.js';

const subject = 'Booking reminder: your rental starts tomorrow';
const payload = {
  type: 'start_tomorrow',
  booking_id: 'e420504-6411-47bb-9845-3b5011dfd9fb',
  tenant_id: '77f596a4-c56d-423d-b35d-d4de15b9ddf6',
  tenant_name: 'Regalia Rentals',
  tenant_slug: 'regalia-rentals',
  tenant_logo_url: 'https://dummyimage.com/120x120/ffffff/4f46e5.png&text=R',
  tenant_accent_color: '#4f46e5',
  tenant_contact_email: 'hello@regaliarentals.com',
  tenant_contact_phone: '+63 912 345 6789',
  storefront_url: 'https://regalia-rentals.arkived.dev',
  customer_name: 'Saler Fernandez',
  equipment_name: 'Canon EOS R6 + RF 24-70mm',
  start_date: '2026-06-18',
  end_date: '2026-06-20'
};

const html = renderNotificationHtml('booking-reminder', subject, payload);
await writeFile(new URL('./reminder-preview-rendered.html', import.meta.url), html, 'utf8');
console.log('Generated api/previews/reminder-preview-rendered.html');
