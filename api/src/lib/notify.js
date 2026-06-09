const logDispatch = (kind, payload) => {
  console.info(`[notify:${kind}]`, payload);
};

export const notify = {
  async bookingStatusChanged(payload) {
    logDispatch('booking-status', payload);
    return { ok: true };
  },

  async maintenanceDue(payload) {
    logDispatch('maintenance-due', payload);
    return { ok: true };
  },

  async bookingReminder(payload) {
    logDispatch('booking-reminder', payload);
    return { ok: true };
  }
};
