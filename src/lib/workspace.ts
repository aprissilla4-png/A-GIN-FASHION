import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Workspace scopes
const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks.readonly',
];

WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const googleSignIn = async (): Promise<{ user: User; accessToken: string; idToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token');
    }

    cachedAccessToken = credential.accessToken;
    const idToken = await result.user.getIdToken();
    
    return { user: result.user, accessToken: cachedAccessToken, idToken };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getWorkspaceToken = () => cachedAccessToken;

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Workspace API Helpers
export const fetchDriveFiles = async (idToken: string, workspaceToken: string) => {
  const res = await fetch('/api/workspace/drive/files', {
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'x-workspace-token': workspaceToken
    }
  });
  return res.json();
};

export const fetchGmailMessages = async (idToken: string, workspaceToken: string) => {
  const res = await fetch('/api/workspace/gmail/messages', {
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'x-workspace-token': workspaceToken
    }
  });
  return res.json();
};

export const fetchCalendarEvents = async (idToken: string, workspaceToken: string) => {
  const res = await fetch('/api/workspace/calendar/events', {
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'x-workspace-token': workspaceToken
    }
  });
  return res.json();
};

export const fetchTasks = async (idToken: string, workspaceToken: string) => {
  const res = await fetch('/api/workspace/tasks', {
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'x-workspace-token': workspaceToken
    }
  });
  return res.json();
};
