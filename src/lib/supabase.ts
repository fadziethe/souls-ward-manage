import { dbOperations, generateId, getCurrentTimestamp } from "./db";

// Simple hash function for password storage (in production, use a proper hashing library)
const simpleHash = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export interface LocalUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

export const signUp = async (email: string, password: string, fullName: string) => {
  try {
    // Check if user already exists
    const existingUsers = await dbOperations.getByIndex('users', 'by-email', email);
    if (existingUsers.length > 0) {
      return { data: null, error: { message: 'User already exists' } };
    }

    const hashedPassword = await simpleHash(password);
    const userId = generateId();

    await dbOperations.add('users', {
      id: userId,
      email,
      password: hashedPassword,
      full_name: fullName,
      created_at: getCurrentTimestamp(),
    });

    // Auto login after signup
    localStorage.setItem('currentUser', JSON.stringify({ id: userId, email, full_name: fullName }));

    return { data: { user: { id: userId, email } }, error: null };
  } catch (error) {
    return { data: null, error: { message: 'Failed to create account' } };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const users = await dbOperations.getByIndex('users', 'by-email', email);
    
    if (users.length === 0) {
      return { data: null, error: { message: 'Invalid email or password' } };
    }

    const user = users[0];
    const hashedPassword = await simpleHash(password);

    if (user.password !== hashedPassword) {
      return { data: null, error: { message: 'Invalid email or password' } };
    }

    // Store session in localStorage
    localStorage.setItem('currentUser', JSON.stringify({ id: user.id, email: user.email, full_name: user.full_name }));

    return { data: { user: { id: user.id, email: user.email } }, error: null };
  } catch (error) {
    return { data: null, error: { message: 'Login failed' } };
  }
};

export const signOut = async () => {
  localStorage.removeItem('currentUser');
  return { error: null };
};

export const getCurrentUser = async (): Promise<{ user: LocalUser | null; session: any }> => {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) {
    return { user: null, session: null };
  }

  try {
    const userData = JSON.parse(userStr);
    return {
      user: {
        id: userData.id,
        email: userData.email,
        user_metadata: { full_name: userData.full_name },
      },
      session: { user: userData },
    };
  } catch {
    return { user: null, session: null };
  }
};
