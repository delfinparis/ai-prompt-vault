import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const USAGE_FILE = path.join(DATA_DIR, 'usage.json');

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  credits: number;
  createdAt: string;
  lastLogin?: string;
}

export interface UsageRecord {
  id: string;
  userId: string;
  address: string;
  timestamp: string;
  creditsUsed: number;
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Read users from file
export async function getUsers(): Promise<User[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save users to file
async function saveUsers(users: User[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  const users = await getUsers();
  return users.find(u => u.id === id) || null;
}

// Create user
export async function createUser(email: string, passwordHash: string): Promise<User> {
  const users = await getUsers();

  // Check if user exists
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('User already exists');
  }

  const newUser: User = {
    id: generateId(),
    email: email.toLowerCase(),
    passwordHash,
    credits: 1, // Start with 1 free credit
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await saveUsers(users);
  return newUser;
}

// Update user credits
export async function updateUserCredits(userId: string, credits: number): Promise<User> {
  const users = await getUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    throw new Error('User not found');
  }

  users[userIndex].credits = credits;
  await saveUsers(users);
  return users[userIndex];
}

// Update last login
export async function updateLastLogin(userId: string): Promise<void> {
  const users = await getUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    throw new Error('User not found');
  }

  users[userIndex].lastLogin = new Date().toISOString();
  await saveUsers(users);
}

// Read usage records
export async function getUsageRecords(): Promise<UsageRecord[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(USAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save usage records
async function saveUsageRecords(records: UsageRecord[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(USAGE_FILE, JSON.stringify(records, null, 2));
}

// Add usage record
export async function addUsageRecord(userId: string, address: string): Promise<void> {
  const records = await getUsageRecords();

  const newRecord: UsageRecord = {
    id: generateId(),
    userId,
    address,
    timestamp: new Date().toISOString(),
    creditsUsed: 1,
  };

  records.push(newRecord);
  await saveUsageRecords(records);
}

// Get user usage history
export async function getUserUsage(userId: string): Promise<UsageRecord[]> {
  const records = await getUsageRecords();
  return records.filter(r => r.userId === userId).sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// Generate simple ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
