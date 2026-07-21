import api from './axios';

export const getMyAttendance = (page = 0, size = 10) =>
  api.get(`/api/attendance/my?page=${page}&size=${size}`);

export const checkIn = (remarks = '') =>
  api.post('/api/attendance/check-in', { remarks });

export const checkOut = (remarks = '') =>
  api.post('/api/attendance/check-out', { remarks });

export const getMyLeaves = (page = 0, size = 10) =>
  api.get(`/api/leaves/my?page=${page}&size=${size}`);

export const getLeaveBalance = () =>
  api.get('/api/leaves/balance');

export const getMyPayslips = (page = 0, size = 10) =>
  api.get(`/api/payslips/my?page=${page}&size=${size}`);

export const getMyNotifications = (page = 0, size = 20) =>
  api.get(`/api/notifications?page=${page}&size=${size}`);

export const getUnreadCount = () =>
  api.get('/api/notifications/unread-count');

export const markNotificationRead = (id) =>
  api.put(`/api/notifications/${id}/read`);

export const getMyPerformance = () =>
  api.get('/api/performance/my');

export const getMyTrainings = () =>
  api.get('/api/trainings/my');