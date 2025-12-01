import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByEmail, createUser, updateLastLogin, User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  id: string;
  email: string;
  credits: number;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(user: User): string {
  const payload: AuthUser = {
    id: user.id,
    email: user.email,
    credits: user.credits,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

// Register new user
export async function registerUser(email: string, password: string): Promise<{ user: User; token: string }> {
  // Validate email
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address');
  }

  // Validate password
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await createUser(email, passwordHash);

  // Generate token
  const token = generateToken(user);

  return { user, token };
}

// Login user
export async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  // Get user
  const user = await getUserByEmail(email);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await updateLastLogin(user.id);

  // Generate token
  const token = generateToken(user);

  return { user, token };
}
