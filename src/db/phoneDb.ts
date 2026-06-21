/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LeaveRequest } from '../types';
import { ManagerRequestSimulation } from '../data';

const DB_NAME = 'AndroidPhoneAbsenceDB';
const DB_VERSION = 1;

export function openPhoneDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Check if indexedDB is supported
    if (!window.indexedDB) {
      console.warn("IndexedDB n'est pas supporté par ce navigateur / appareil. Repli sur localStorage.");
      reject(new Error("IndexedDB non supporté"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event);
      reject(new Error('Impossible d\'ouvrir la base de données interne du téléphone'));
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;

      // Object store for user requests (primary key: id)
      if (!db.objectStoreNames.contains('user_requests')) {
        db.createObjectStore('user_requests', { keyPath: 'id' });
      }

      // Object store for team requests
      if (!db.objectStoreNames.contains('team_requests')) {
        db.createObjectStore('team_requests', { keyPath: 'id' });
      }

      // Object store for general settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    };
  });
}

// User Requests operations
export async function dbGetUserRequests(): Promise<LeaveRequest[]> {
  try {
    const db = await openPhoneDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('user_requests', 'readonly');
      const store = transaction.objectStore('user_requests');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        reject(new Error('Erreur de lecture des demandes utilisateur depuis IndexedDB'));
      };
    });
  } catch (err) {
    // Fallback to localStorage
    const saved = localStorage.getItem('user_absence_requests');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  }
}

export async function dbSaveUserRequests(requests: LeaveRequest[]): Promise<void> {
  try {
    const db = await openPhoneDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('user_requests', 'readwrite');
      const store = transaction.objectStore('user_requests');

      // Clear and re-add to maintain list
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        let completed = 0;
        let errored = false;

        if (requests.length === 0) {
          resolve();
          return;
        }

        requests.forEach((req) => {
          const addReq = store.add(req);
          addReq.onsuccess = () => {
            completed++;
            if (completed === requests.length && !errored) {
              resolve();
            }
          };
          addReq.onerror = () => {
            if (!errored) {
              errored = true;
              reject(new Error('Erreur d\'écriture dans la base de données interne'));
            }
          };
        });
      };
      
      clearReq.onerror = () => {
        reject(new Error('Erreur lors de la réinitialisation de l\'index des demandes'));
      };
    });
  } catch (err) {
    // Sync to localStorage as well for secondary backup
    localStorage.setItem('user_absence_requests', JSON.stringify(requests));
  }
}

// Team Requests operations
export async function dbGetTeamRequests(): Promise<ManagerRequestSimulation[]> {
  try {
    const db = await openPhoneDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('team_requests', 'readonly');
      const store = transaction.objectStore('team_requests');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        reject(new Error('Erreur de lecture des demandes d\'équipe'));
      };
    });
  } catch (err) {
    const saved = localStorage.getItem('team_absence_requests');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  }
}

export async function dbSaveTeamRequests(requests: ManagerRequestSimulation[]): Promise<void> {
  try {
    const db = await openPhoneDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('team_requests', 'readwrite');
      const store = transaction.objectStore('team_requests');

      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        let completed = 0;
        let errored = false;

        if (requests.length === 0) {
          resolve();
          return;
        }

        requests.forEach((req) => {
          const addReq = store.add(req);
          addReq.onsuccess = () => {
            completed++;
            if (completed === requests.length && !errored) {
              resolve();
            }
          };
          addReq.onerror = () => {
            if (!errored) {
              errored = true;
              reject(new Error('Erreur d\'écriture pour les demandes équipe'));
            }
          };
        });
      };
    });
  } catch (err) {
    localStorage.setItem('team_absence_requests', JSON.stringify(requests));
  }
}

// Setting operations
export async function dbGetSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await openPhoneDB();
    return new Promise((resolve) => {
      const transaction = db.transaction('settings', 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result !== undefined ? request.result as T : defaultValue);
      };
      request.onerror = () => {
        resolve(defaultValue);
      };
    });
  } catch (err) {
    const val = localStorage.getItem(key);
    if (val !== null) {
      try {
        return JSON.parse(val) as T;
      } catch {
        return val as unknown as T;
      }
    }
    return defaultValue;
  }
}

export async function dbSaveSetting(key: string, value: any): Promise<void> {
  // Always sync to localStorage as secondary persistent redundancy
  try {
    localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value.toString());
    const db = await openPhoneDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('settings', 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put(value, key);

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(new Error(`Impossible de sauvegarder le paramètre: ${key}`));
      };
    });
  } catch (err) {
    // If IndexedDB fails, we already set it in localStorage above
  }
}
