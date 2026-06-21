/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LeaveRequest, LeaveType } from './types';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export const CURRENT_USER: TeamMember = {
  id: 'SophieD',
  name: 'Sophie Dubois',
  role: 'Product Designer',
  avatar: 'SD',
};

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 'SophieD', name: 'Sophie Dubois', role: 'Product Designer', avatar: 'SD' },
  { id: 'AlexandreL', name: 'Alexandre Leclerc', role: 'Lead Developer', avatar: 'AL' },
  { id: 'JulieM', name: 'Julie Martin', role: 'QA Engineer', avatar: 'JM' },
  { id: 'ThomasB', name: 'Thomas Bernard', role: 'DevOps Specialist', avatar: 'TB' },
];

/**
 * Historical and future seed requests
 * Note: Current year is 2026 based on workspace clock.
 */
export const SEED_REQUESTS: LeaveRequest[] = [
  {
    id: 'req1',
    type: LeaveType.CP,
    startDate: '2026-05-04',
    startPeriod: 'FULL',
    endDate: '2026-05-08',
    endPeriod: 'FULL',
    daysCount: 5.0, // 5 working days (May 8 is Victory Day, but wait, let's see: May 8 is indeed a public holiday! So if Monday 4 to Friday 8, and May 8 is holiday, then it's 4 working days)
    comment: 'Vacances de printemps au soleil',
    status: 'APPROVED',
    createdAt: '2026-04-10T14:30:00Z',
  },
  {
    id: 'req2',
    type: LeaveType.RTT,
    startDate: '2026-05-15',
    startPeriod: 'AFTERNOON',
    endDate: '2026-05-15',
    endPeriod: 'AFTERNOON',
    daysCount: 0.5,
    comment: 'Rendez-vous médical',
    status: 'APPROVED',
    createdAt: '2026-05-01T09:15:00Z',
  },
  {
    id: 'req3',
    type: LeaveType.CP,
    startDate: '2026-07-13',
    startPeriod: 'FULL',
    endDate: '2026-07-17',
    endPeriod: 'FULL',
    daysCount: 4.0, // July 14 is holiday, so 5 - 1 = 4 working days
    comment: 'Pont de la fête nationale',
    status: 'PENDING',
    createdAt: '2026-05-20T11:00:00Z',
  },
  {
    id: 'req4',
    type: LeaveType.MALADIE,
    startDate: '2026-03-10',
    startPeriod: 'FULL',
    endDate: '2026-03-11',
    endPeriod: 'FULL',
    daysCount: 2.0,
    comment: 'Grippe saisonnière',
    status: 'APPROVED',
    createdAt: '2026-03-10T08:00:00Z',
  },
];

export interface ManagerRequestSimulation {
  id: string;
  applicant: TeamMember;
  type: LeaveType;
  startDate: string;
  startPeriod: 'FULL' | 'MORNING' | 'AFTERNOON';
  endDate: string;
  endPeriod: 'FULL' | 'MORNING' | 'AFTERNOON';
  daysCount: number;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export const SEED_TEAM_REQUESTS: ManagerRequestSimulation[] = [
  {
    id: 'team-req1',
    applicant: TEAM_MEMBERS[1], // Alexandre
    type: LeaveType.CP,
    startDate: '2026-06-22',
    startPeriod: 'FULL',
    endDate: '2026-07-03',
    endPeriod: 'FULL',
    daysCount: 10.0,
    comment: 'Congés d’été en famille',
    status: 'PENDING',
    createdAt: '2026-05-25T16:40:00Z',
  },
  {
    id: 'team-req2',
    applicant: TEAM_MEMBERS[2], // Julie
    type: LeaveType.RTT,
    startDate: '2026-06-12',
    startPeriod: 'AFTERNOON',
    endDate: '2026-06-12',
    endPeriod: 'AFTERNOON',
    daysCount: 0.5,
    comment: 'Déménagement personnel (après-midi)',
    status: 'PENDING',
    createdAt: '2026-06-01T10:12:00Z',
  },
  {
    id: 'team-req3',
    applicant: TEAM_MEMBERS[3], // Thomas
    type: LeaveType.EXCEPTIONNEL,
    startDate: '2026-05-18',
    startPeriod: 'FULL',
    endDate: '2026-05-20',
    endPeriod: 'FULL',
    daysCount: 3.0,
    comment: 'Mariage d’un proche (justificatif fourni)',
    status: 'APPROVED',
    createdAt: '2026-05-02T13:22:00Z',
  },
];
