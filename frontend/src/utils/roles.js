export const ROLES = { PATIENT: 'PATIENT', DOCTOR: 'DOCTOR', STAFF: 'STAFF' };

export const ROLE_HOME = {
  PATIENT: '/patient',
  DOCTOR: '/doctor',
  STAFF: '/staff',
};

export const ROLE_LABEL = {
  PATIENT: 'Patient',
  DOCTOR: 'Doctor',
  STAFF: 'Clinic Staff / Administrator',
};

export const homeFor = (role) => ROLE_HOME[role] || '/login';

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
