import { auth } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const rawMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code || (rawMsg.includes('permission') ? 'permission-denied' : 'firestore/error');

  const errInfo: FirestoreErrorInfo = {
    error: rawMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  // Logged solely to internal developer console, never exposed to user UI
  console.error('Firestore Technical Error: ', JSON.stringify(errInfo));

  let shortCode = 'firestore/error';
  let userMessage = 'Une erreur est survenue lors de l\'enregistrement des données.';

  if (errCode.includes('permission-denied') || rawMsg.toLowerCase().includes('permission')) {
    shortCode = 'permission-denied';
    userMessage = 'Action non autorisée. Vos permissions ne permettent pas cette modification.';
  } else if (errCode.includes('not-found') || rawMsg.toLowerCase().includes('not found') || rawMsg.toLowerCase().includes('introuvable')) {
    shortCode = 'not-found';
    userMessage = 'L\'élément demandé est introuvable ou a été supprimé.';
  } else if (errCode.includes('already-exists') || rawMsg.toLowerCase().includes('already exists')) {
    shortCode = 'already-exists';
    userMessage = 'Cet élément existe déjà dans la base de données.';
  } else if (errCode.includes('unauthenticated') || rawMsg.toLowerCase().includes('unauthenticated')) {
    shortCode = 'unauthenticated';
    userMessage = 'Votre session a expiré. Veuillez vous reconnecter avec votre compte Google.';
  } else if (errCode.includes('resource-exhausted')) {
    shortCode = 'resource-exhausted';
    userMessage = 'Limite temporaire de requêtes atteinte. Veuillez réessayer dans quelques instants.';
  }

  throw new Error(`[${shortCode}] ${userMessage}`);
}
