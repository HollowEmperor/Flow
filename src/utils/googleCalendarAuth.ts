import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token strictly in memory (never in localStorage or sessionStorage).
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export interface GoogleCalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  htmlLink?: string;
  start: {
    date?: string;
    dateTime?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
  };
}

export async function listGoogleCalendarEvents(
  timeMinIso: string,
  timeMaxIso: string
): Promise<GoogleCalendarEventItem[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }
  const url = new URL(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events'
  );
  url.searchParams.set('timeMin', timeMinIso);
  url.searchParams.set('timeMax', timeMaxIso);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '100');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error('AUTH_REQUIRED');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || 'Failed to load Google Calendar events'
    );
  }

  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

export async function createGoogleCalendarEvent(params: {
  summary: string;
  description?: string;
  dateIso: string; // YYYY-MM-DD (all-day event)
}): Promise<GoogleCalendarEventItem> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  // Compute next day for exclusive all-day end.date per Google Calendar API spec
  const [y, m, d] = params.dateIso.split('-').map(Number);
  const nextDateObj = new Date(y, m - 1, d + 1);
  const endYear = nextDateObj.getFullYear();
  const endMonth = String(nextDateObj.getMonth() + 1).padStart(2, '0');
  const endDay = String(nextDateObj.getDate()).padStart(2, '0');
  const endDateIso = `${endYear}-${endMonth}-${endDay}`;

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: params.summary,
        description: params.description || 'Synced from FocusFlow Tasks',
        start: { date: params.dateIso },
        end: { date: endDateIso },
      }),
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error('AUTH_REQUIRED');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || 'Failed to create Google Calendar event'
    );
  }

  return res.json();
}

export async function deleteGoogleCalendarEvent(eventId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(
      eventId
    )}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error('AUTH_REQUIRED');
  }

  if (!res.ok && res.status !== 204) {
    throw new Error('Failed to delete Google Calendar event');
  }
}
