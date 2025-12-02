// Serverless-compatible database using Google Sheets as backend

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

// In-memory cache (resets on cold starts, but Google Sheets is source of truth)
const usersCache = new Map<string, User>();
const usageCache: UsageRecord[] = [];

// Google Sheets webhook for persistence
async function callGoogleSheets(action: string, data: Record<string, unknown>) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('Google Sheets webhook not configured');
    return null;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data }),
    });
    return await response.json();
  } catch (error) {
    console.error('Google Sheets error:', error);
    return null;
  }
}

// Get user by email (check cache first, then Google Sheets)
export async function getUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase();

  // Check cache
  for (const user of usersCache.values()) {
    if (user.email.toLowerCase() === normalizedEmail) {
      return user;
    }
  }

  // Try to fetch from Google Sheets
  const result = await callGoogleSheets('getUser', { email: normalizedEmail });
  if (result?.user) {
    const user = result.user as User;
    usersCache.set(user.id, user);
    return user;
  }

  return null;
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  // Check cache
  if (usersCache.has(id)) {
    return usersCache.get(id)!;
  }

  // Try to fetch from Google Sheets
  const result = await callGoogleSheets('getUserById', { id });
  if (result?.user) {
    const user = result.user as User;
    usersCache.set(user.id, user);
    return user;
  }

  return null;
}

// Create user
export async function createUser(email: string, passwordHash: string): Promise<User> {
  const normalizedEmail = email.toLowerCase();

  // Check if user exists
  const existing = await getUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error('User already exists');
  }

  const newUser: User = {
    id: generateId(),
    email: normalizedEmail,
    passwordHash,
    credits: 5, // Testing: 5 free credits
    createdAt: new Date().toISOString(),
  };

  // Save to cache
  usersCache.set(newUser.id, newUser);

  // Persist to Google Sheets
  await callGoogleSheets('createUser', {
    id: newUser.id,
    email: newUser.email,
    passwordHash: newUser.passwordHash,
    credits: newUser.credits,
    createdAt: newUser.createdAt,
  });

  return newUser;
}

// Update user credits (serverless-safe: just persists to Google Sheets)
export async function updateUserCredits(userId: string, credits: number, email?: string): Promise<void> {
  // Update cache if user exists there
  const cachedUser = usersCache.get(userId);
  if (cachedUser) {
    cachedUser.credits = credits;
    usersCache.set(userId, cachedUser);
  }

  // Persist to Google Sheets
  await callGoogleSheets('updateUserCredits', { id: userId, email, credits });
}

// Update last login
export async function updateLastLogin(userId: string): Promise<void> {
  let user: User | undefined = usersCache.get(userId);

  if (!user) {
    const fetched = await getUserById(userId);
    if (fetched) user = fetched;
  }

  if (!user) {
    throw new Error('User not found');
  }

  user.lastLogin = new Date().toISOString();
  usersCache.set(userId, user);

  // Persist to Google Sheets
  await callGoogleSheets('updateLastLogin', { id: userId, lastLogin: user.lastLogin });
}

// Add usage record
export async function addUsageRecord(userId: string, address: string): Promise<void> {
  const newRecord: UsageRecord = {
    id: generateId(),
    userId,
    address,
    timestamp: new Date().toISOString(),
    creditsUsed: 1,
  };

  usageCache.push(newRecord);

  // Persist to Google Sheets (already handled by saveLead in route.ts)
}

// Get user usage history
export async function getUserUsage(userId: string): Promise<UsageRecord[]> {
  return usageCache.filter(r => r.userId === userId).sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// Get all users (for admin)
export async function getUsers(): Promise<User[]> {
  return Array.from(usersCache.values());
}

// Generate simple ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
