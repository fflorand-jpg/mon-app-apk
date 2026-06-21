/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum LeaveType {
  CP = 'CP',                 // Congés Payés
  RTT = 'RTT',               // RTT
  MALADIE = 'MALADIE',       // Arrêt Maladie
  EXCEPTIONNEL = 'EXCEPTIONNEL', // Congés exceptionnels (événement familial)
  SANS_SOLDE = 'SANS_SOLDE', // Congé sans solde
}

export type LeavePeriod = 'FULL' | 'MORNING' | 'AFTERNOON';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  id: string;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  startPeriod: LeavePeriod;
  endDate: string; // YYYY-MM-DD
  endPeriod: LeavePeriod;
  daysCount: number; // calculated working days
  comment: string;
  status: RequestStatus;
  createdAt: string; // ISO timestamp
}

export interface LeaveBalance {
  allocated: number;
  taken: number;
  pending: number;
  remaining: number;
}

export interface UserBalances {
  [LeaveType.CP]: LeaveBalance;
  [LeaveType.RTT]: LeaveBalance;
}

export interface PublicHoliday {
  date: string; // YYYY-MM-DD
  name: string;
}
