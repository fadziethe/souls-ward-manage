import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define database schema
interface HospitalDB extends DBSchema {
  patients: {
    key: string;
    value: {
      id: string;
      patient_number: string;
      full_name: string;
      date_of_birth: string;
      gender: string;
      phone: string;
      email: string | null;
      address: string | null;
      emergency_contact_name: string | null;
      emergency_contact_phone: string | null;
      blood_group: string | null;
      status: string;
      created_by: string;
      created_at: string;
      updated_at: string;
    };
    indexes: { 'by-number': string; 'by-name': string };
  };
  appointments: {
    key: string;
    value: {
      id: string;
      patient_id: string;
      doctor_id: string;
      appointment_date: string;
      appointment_time: string;
      reason: string;
      status: string;
      notes: string | null;
      created_by: string;
      created_at: string;
      updated_at: string;
    };
    indexes: { 'by-patient': string; 'by-date': string };
  };
  medical_records: {
    key: string;
    value: {
      id: string;
      patient_id: string;
      doctor_id: string;
      visit_date: string;
      diagnosis: string;
      treatment: string | null;
      prescription: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
    };
    indexes: { 'by-patient': string; 'by-date': string };
  };
  staff: {
    key: string;
    value: {
      id: string;
      staff_number: string;
      full_name: string;
      role: string;
      department: string | null;
      specialization: string | null;
      phone: string;
      email: string;
      hire_date: string;
      created_at: string;
      updated_at: string;
    };
    indexes: { 'by-number': string; 'by-role': string };
  };
  users: {
    key: string;
    value: {
      id: string;
      email: string;
      password: string;
      full_name: string;
      created_at: string;
    };
    indexes: { 'by-email': string };
  };
}

let dbInstance: IDBPDatabase<HospitalDB> | null = null;

// Initialize database
export const initDB = async (): Promise<IDBPDatabase<HospitalDB>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<HospitalDB>('hospital-records', 1, {
    upgrade(db) {
      // Create patients store
      if (!db.objectStoreNames.contains('patients')) {
        const patientStore = db.createObjectStore('patients', { keyPath: 'id' });
        patientStore.createIndex('by-number', 'patient_number', { unique: true });
        patientStore.createIndex('by-name', 'full_name');
      }

      // Create appointments store
      if (!db.objectStoreNames.contains('appointments')) {
        const appointmentStore = db.createObjectStore('appointments', { keyPath: 'id' });
        appointmentStore.createIndex('by-patient', 'patient_id');
        appointmentStore.createIndex('by-date', 'appointment_date');
      }

      // Create medical_records store
      if (!db.objectStoreNames.contains('medical_records')) {
        const recordStore = db.createObjectStore('medical_records', { keyPath: 'id' });
        recordStore.createIndex('by-patient', 'patient_id');
        recordStore.createIndex('by-date', 'visit_date');
      }

      // Create staff store
      if (!db.objectStoreNames.contains('staff')) {
        const staffStore = db.createObjectStore('staff', { keyPath: 'id' });
        staffStore.createIndex('by-number', 'staff_number', { unique: true });
        staffStore.createIndex('by-role', 'role');
      }

      // Create users store
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('by-email', 'email', { unique: true });
      }
    },
  });

  return dbInstance;
};

// Generic CRUD operations
export const dbOperations = {
  // Get all records from a store
  async getAll<T extends keyof HospitalDB>(storeName: T): Promise<HospitalDB[T]['value'][]> {
    const db = await initDB();
    return db.getAll(storeName as any);
  },

  // Get a single record by ID
  async getById<T extends keyof HospitalDB>(
    storeName: T,
    id: string
  ): Promise<HospitalDB[T]['value'] | undefined> {
    const db = await initDB();
    return db.get(storeName as any, id);
  },

  // Add a new record
  async add<T extends keyof HospitalDB>(storeName: T, value: HospitalDB[T]['value']): Promise<string> {
    const db = await initDB();
    return db.add(storeName as any, value as any) as any;
  },

  // Update a record
  async update<T extends keyof HospitalDB>(storeName: T, value: HospitalDB[T]['value']): Promise<string> {
    const db = await initDB();
    return db.put(storeName as any, value as any) as any;
  },

  // Delete a record
  async delete<T extends keyof HospitalDB>(storeName: T, id: string): Promise<void> {
    const db = await initDB();
    return db.delete(storeName as any, id);
  },

  // Query by index
  async getByIndex<T extends keyof HospitalDB>(
    storeName: T,
    indexName: string,
    value: string
  ): Promise<HospitalDB[T]['value'][]> {
    const db = await initDB();
    return db.getAllFromIndex(storeName as any, indexName as any, value);
  },
};

// Generate UUID
export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Get current timestamp
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};
