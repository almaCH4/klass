import { parseFullIcsContent } from '../src/utils/icsParser';

export interface Env {
  ICAL_URL?: string;
  FIREBASE_PROJECT_ID?: string;
  FIRESTORE_DATABASE_ID?: string;
  DEFAULT_CLASS_ID?: string;
  // Secrets Cloudflare pour l'écriture automatique hors-ligne dans Firestore
  FIREBASE_SERVICE_ACCOUNT_KEY?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_PRIVATE_KEY?: string;
  ASSETS?: {
    fetch: typeof fetch;
  };
}

const DEFAULT_FIREBASE_PROJECT_ID = 'gen-lang-client-0363039511';
const DEFAULT_FIRESTORE_DATABASE_ID = 'ai-studio-klassespaceclass-223bae4d-3e46-4311-92f1-daaf9b6a0c6c';

// In-memory cache fallback for server-side 15-min cache
let inMemoryCache: {
  timestamp: number;
  data: any;
} | null = null;

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array | string): string {
  let binary = '';
  if (typeof buffer === 'string') {
    binary = buffer;
  } else {
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Génère un jeton Google OAuth2 à partir de la clé de compte de service stockée dans les secrets Cloudflare.
 */
async function getGoogleServiceAccountToken(env: Env): Promise<string | null> {
  let clientEmail = env.FIREBASE_CLIENT_EMAIL;
  let privateKeyPem = env.FIREBASE_PRIVATE_KEY;

  if (env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
      clientEmail = parsed.client_email || clientEmail;
      privateKeyPem = parsed.private_key || privateKeyPem;
    } catch (err) {
      console.warn('Impossible de parser FIREBASE_SERVICE_ACCOUNT_KEY:', err);
    }
  }

  if (!clientEmail || !privateKeyPem) {
    return null;
  }

  try {
    // Nettoyer la clé PEM pour extraire le binaire PKCS8
    const cleanPem = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/[\r\n\s]/g, '');

    const binaryDerString = atob(cleanPem);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    const importedKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryDer.buffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    );

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      importedKey,
      new TextEncoder().encode(unsignedToken)
    );

    const signedJwt = `${unsignedToken}.${base64UrlEncode(signature)}`;

    // Échange avec le point de terminaison OAuth2 de Google
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: signedJwt
      })
    });

    if (!tokenRes.ok) {
      console.warn('Erreur échange jeton Google OAuth2:', await tokenRes.text());
      return null;
    }

    const tokenData: any = await tokenRes.json();
    return tokenData.access_token || null;
  } catch (err) {
    console.error('Erreur signature JWT Google Service Account:', err);
    return null;
  }
}

/**
 * Convertit un objet JavaScript standard en types de valeurs Firestore REST API
 */
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  return fields;
}

/**
 * Vérifie qu'une URL est sécurisée en HTTPS et appartient au domaine index-education.net
 */
function isValidIndexEducationUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return host === 'index-education.net' || host.endsWith('.index-education.net');
  } catch {
    return false;
  }
}

/**
 * Récupère le lien iCal enregistré pour une classe dans Firestore (classes/{classId}/settings/pronote)
 */
async function getClassPronoteIcalUrl(
  classId: string,
  env: Env,
  bearerToken?: string | null
): Promise<string | null> {
  const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
  const databaseId = env.FIRESTORE_DATABASE_ID || DEFAULT_FIRESTORE_DATABASE_ID;

  const token = bearerToken || (await getGoogleServiceAccountToken(env));
  if (!token) return null;

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/classes/${encodeURIComponent(classId)}/settings/pronote`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) return null;
    const data: any = await res.json();
    const link = data.fields?.icalUrl?.stringValue || null;
    if (link && isValidIndexEducationUrl(link)) {
      return link;
    }
    return null;
  } catch (err) {
    console.warn(`Erreur lecture lien iCal pour classe ${classId}:`, err);
    return null;
  }
}

/**
 * Écrit les cours et met à jour les métadonnées de la classe dans Firestore via REST API
 * Les devoirs sont rangés dans la sous-collection classes/{classId}/homework/{homeworkId}
 */
async function writeScheduleToFirestore(
  classId: string,
  parsedData: ReturnType<typeof parseFullIcsContent>,
  env: Env,
  bearerToken?: string | null
): Promise<void> {
  const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
  const databaseId = env.FIRESTORE_DATABASE_ID || DEFAULT_FIRESTORE_DATABASE_ID;

  const token = bearerToken || (await getGoogleServiceAccountToken(env));
  if (!token) {
    throw new Error('Jeton d\'authentification Firestore manquant (compte de service requis).');
  }

  const nowParis = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());

  const syncTimestamp = `Aujourd'hui à ${nowParis}`;
  const basePath = `projects/${projectId}/databases/${databaseId}/documents`;

  // 1. Mettre à jour le document de la classe (SANS homeworkList pour respecter la limite de 1 Mo)
  const classDocPath = `${basePath}/classes/${classId}`;
  const classUpdates = {
    lessonSessions: parsedData.sessions,
    availableGroups: parsedData.availableGroups,
    pronoteLastSynced: syncTimestamp,
    pronoteLastSyncedIso: new Date().toISOString(),
    pronoteSyncStatus: 'success',
    pronoteSyncError: null
  };

  await fetch(`${classDocPath}?updateMask.fieldPaths=lessonSessions&updateMask.fieldPaths=availableGroups&updateMask.fieldPaths=pronoteLastSynced&updateMask.fieldPaths=pronoteLastSyncedIso&updateMask.fieldPaths=pronoteSyncStatus&updateMask.fieldPaths=pronoteSyncError`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: toFirestoreFields(classUpdates)
    })
  });

  // 2. Écrire les cours par lots de 250 via documents:commit
  const courses = parsedData.courses;
  const batchSize = 250;
  for (let i = 0; i < courses.length; i += batchSize) {
    const chunk = courses.slice(i, i + batchSize);
    const writes = chunk.map((c) => ({
      update: {
        name: `${basePath}/classes/${classId}/courses/${c.id}`,
        fields: toFirestoreFields(c)
      }
    }));

    await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:commit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ writes })
    });
  }

  // 3. Écrire les devoirs dans la sous-collection classes/{classId}/homework/{homeworkId}
  const homeworkList = parsedData.homework || [];
  for (let i = 0; i < homeworkList.length; i += batchSize) {
    const chunk = homeworkList.slice(i, i + batchSize);
    const writes = chunk.map((hw) => ({
      update: {
        name: `${basePath}/classes/${classId}/homework/${hw.id}`,
        fields: toFirestoreFields(hw)
      }
    }));

    await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:commit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ writes })
    });
  }
}

/**
 * Enregistre une erreur de synchronisation dans le document de classe
 */
async function recordSyncError(
  classId: string,
  errorMessage: string,
  env: Env,
  bearerToken?: string | null
): Promise<void> {
  const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
  const databaseId = env.FIRESTORE_DATABASE_ID || DEFAULT_FIRESTORE_DATABASE_ID;

  const token = bearerToken || (await getGoogleServiceAccountToken(env));
  if (!token) return;

  try {
    const classDocPath = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/classes/${classId}?updateMask.fieldPaths=pronoteSyncStatus&updateMask.fieldPaths=pronoteSyncError&updateMask.fieldPaths=pronoteLastSyncAttempt`;
    await fetch(classDocPath, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: toFirestoreFields({
          pronoteSyncStatus: 'error',
          pronoteSyncError: errorMessage,
          pronoteLastSyncAttempt: new Date().toISOString()
        })
      })
    });
  } catch (err) {
    console.warn('Erreur enregistrement log erreur:', err);
  }
}

/**
 * Point d'entrée de la tâche planifiée Cloudflare Cron Trigger (toutes les 15 minutes)
 */
async function handleScheduledSync(env: Env): Promise<void> {
  console.log('⏰ Déclenchement de la synchronisation automatique Cloudflare Cron (15 min)...');

  const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
  const databaseId = env.FIRESTORE_DATABASE_ID || DEFAULT_FIRESTORE_DATABASE_ID;

  const adminToken = await getGoogleServiceAccountToken(env);
  if (!adminToken) {
    console.warn(
      '⚠️ Secret FIREBASE_SERVICE_ACCOUNT_KEY absent dans Cloudflare. La tâche Cron attend la configuration du secret pour synchroniser en tâche de fond.'
    );
    return;
  }

  try {
    // Lister les classes existantes
    const classesUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/classes`;
    const classesRes = await fetch(classesUrl, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    if (!classesRes.ok) {
      console.error('Échec lecture classes pour Cron:', await classesRes.text());
      return;
    }

    const classesData: any = await classesRes.json();
    const classDocs = classesData.documents || [];

    for (const doc of classDocs) {
      const docName = doc.name || '';
      const classId = docName.split('/').pop();
      if (!classId) continue;

      // 1. Lire le lien iCal enregistré pour cette classe
      let icalUrl = await getClassPronoteIcalUrl(classId, env, adminToken);
      if (!icalUrl && env.ICAL_URL) {
        icalUrl = env.ICAL_URL;
      }

      if (!icalUrl) {
        // Pas de lien iCal configuré pour cette classe, passer à la suivante
        continue;
      }

      // 2. Télécharger le flux iCal
      try {
        const pronoteRes = await fetch(icalUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/calendar, text/plain, */*'
          }
        });

        if (!pronoteRes.ok) {
          const errMsg = `Code HTTP ${pronoteRes.status} reçu lors du téléchargement du calendrier Pronote.`;
          await recordSyncError(classId, errMsg, env, adminToken);
          continue;
        }

        const icsText = await pronoteRes.text();
        if (!icsText || !icsText.includes('BEGIN:VCALENDAR')) {
          await recordSyncError(classId, 'Le flux reçu n\'est pas un calendrier iCalendar valide.', env, adminToken);
          continue;
        }

        // 3. Analyser et injecter dans Firestore
        const parsed = parseFullIcsContent(icsText, classId);
        await writeScheduleToFirestore(classId, parsed, env, adminToken);
        console.log(`✅ Synchronisation réussie pour la classe ${classId} (${parsed.courses.length} cours).`);
      } catch (classSyncErr: any) {
        console.error(`Erreur synchro classe ${classId}:`, classSyncErr);
        await recordSyncError(classId, classSyncErr.message || 'Erreur réseau', env, adminToken);
      }
    }
  } catch (err: any) {
    console.error('Erreur globale Cron Trigger:', err);
  }
}

/**
 * Vérifie le jeton Firebase d'un utilisateur et son appartenance à la classe
 */
async function verifyFirebaseUserAndClass(
  authHeader: string | null,
  requestedClassId: string | null,
  env: Env
): Promise<{ valid: boolean; uid?: string; classId?: string; error?: string; status?: number; token?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      valid: false,
      status: 401,
      error: 'Authentification requise : en-tête Authorization Bearer manquant.'
    };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return {
      valid: false,
      status: 401,
      error: 'Jeton d\'authentification Firebase vide.'
    };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return {
      valid: false,
      status: 401,
      error: 'Format de jeton d\'authentification invalide.'
    };
  }

  let payload: any;
  try {
    const payloadJson = decodeBase64Url(parts[1]);
    payload = JSON.parse(payloadJson);
  } catch {
    return {
      valid: false,
      status: 401,
      error: 'Impossible de décoder le jeton d\'authentification.'
    };
  }

  const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
  const databaseId = env.FIRESTORE_DATABASE_ID || DEFAULT_FIRESTORE_DATABASE_ID;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    return {
      valid: false,
      status: 401,
      error: 'Le jeton d\'authentification Firebase a expiré. Veuillez vous reconnecter.'
    };
  }

  if (payload.iss && payload.iss !== `https://securetoken.google.com/${projectId}`) {
    return {
      valid: false,
      status: 401,
      error: 'Émetteur de jeton Firebase non autorisé pour ce projet.'
    };
  }

  if (payload.aud && payload.aud !== projectId) {
    return {
      valid: false,
      status: 401,
      error: 'Audience de jeton Firebase invalide.'
    };
  }

  const uid = payload.sub || payload.user_id;
  if (!uid) {
    return {
      valid: false,
      status: 401,
      error: 'Identifiant utilisateur manquant dans le jeton.'
    };
  }

  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users/${encodeURIComponent(uid)}`;
    const firestoreRes = await fetch(firestoreUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!firestoreRes.ok) {
      if (firestoreRes.status === 401 || firestoreRes.status === 403) {
        return {
          valid: false,
          status: 403,
          error: 'Accès refusé par les règles de sécurité Firestore.'
        };
      }
      return {
        valid: false,
        status: 403,
        error: `Impossible de vérifier l'appartenance à la classe (code Firestore : ${firestoreRes.status}).`
      };
    }

    const userData: any = await firestoreRes.json();
    const userClassId = userData.fields?.classId?.stringValue;

    if (!userClassId) {
      return {
        valid: false,
        status: 403,
        error: 'Accès refusé : vous devez avoir rejoint une classe pour synchroniser l\'emploi du temps.'
      };
    }

    if (requestedClassId && requestedClassId !== userClassId) {
      return {
        valid: false,
        status: 403,
        error: 'Accès refusé : vous n\'êtes pas membre de cette classe.'
      };
    }

    return {
      valid: true,
      uid,
      classId: userClassId,
      token
    };
  } catch (err: any) {
    return {
      valid: false,
      status: 500,
      error: 'Erreur lors de la vérification de l\'appartenance à la classe : ' + (err.message || 'Erreur réseau')
    };
  }
}

/**
 * Gestionnaire du point de terminaison /api/pronote (déclenché par « Synchroniser maintenant » ou les requêtes clientes)
 */
async function handlePronoteSync(
  request: Request,
  env: Env,
  ctx?: { waitUntil: (p: Promise<any>) => void }
): Promise<Response> {
  const url = new URL(request.url);
  const requestedClassId = url.searchParams.get('classId');
  const customUrlParam = url.searchParams.get('icalUrl');

  // 1. Vérification de l'authentification Firebase
  const authHeader = request.headers.get('Authorization');
  const authResult = await verifyFirebaseUserAndClass(authHeader, requestedClassId, env);

  if (!authResult.valid) {
    return new Response(
      JSON.stringify({
        success: false,
        error: authResult.error || 'Non autorisé'
      }),
      {
        status: authResult.status || 401,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, private',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  const effectiveClassId = requestedClassId || authResult.classId || 'default';

  // 2. Résolution STRICTEMENT sécurisée du lien iCal :
  // Le worker ne doit lire le lien que dans classes/{classId}/settings/pronote, et n'accepter que des URL https sur des domaines index-education.net
  let icalUrl = await getClassPronoteIcalUrl(effectiveClassId, env, authResult.token);

  if (!icalUrl || typeof icalUrl !== 'string' || !isValidIndexEducationUrl(icalUrl)) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          'Aucun lien Pronote valide configuré pour cette classe (classes/' + effectiveClassId + '/settings/pronote). Le lien doit obligatoirement être en https:// et appartenir au domaine index-education.net.'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, private',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  // 3. Téléchargement sécurisé côté serveur
  try {
    const pronoteRes = await fetch(icalUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/calendar, text/plain, */*'
      }
    });

    if (!pronoteRes.ok) {
      const errMsg = `Échec du téléchargement iCal Pronote (Code HTTP : ${pronoteRes.status}). Vérifiez le lien d'abonnement.`;
      await recordSyncError(effectiveClassId, errMsg, env, authResult.token);
      return new Response(
        JSON.stringify({
          success: false,
          error: errMsg
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, private',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const icsText = await pronoteRes.text();
    if (!icsText || !icsText.includes('BEGIN:VCALENDAR')) {
      const errMsg = 'Le serveur Pronote n\'a pas renvoyé de flux iCalendar valide.';
      await recordSyncError(effectiveClassId, errMsg, env, authResult.token);
      return new Response(
        JSON.stringify({
          success: false,
          error: errMsg
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, private',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // 4. Analyse des cours, devoirs et séances
    const parsed = parseFullIcsContent(icsText, effectiveClassId);

    // 5. Écrire directement dans Firestore si un jeton admin ou utilisateur est disponible
    try {
      await writeScheduleToFirestore(effectiveClassId, parsed, env, authResult.token);
    } catch (writeErr: any) {
      console.warn('Note : écriture directe serveur non finalisée, transmission au client:', writeErr.message);
    }

    const resultPayload = {
      success: true,
      courses: parsed.courses,
      homework: parsed.homework,
      sessions: parsed.sessions,
      availableGroups: parsed.availableGroups,
      syncedAt: new Date().toISOString()
    };

    return new Response(JSON.stringify(resultPayload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, private',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    const errMsg = 'Impossible de joindre le serveur Pronote : ' + (err.message || 'Erreur réseau');
    await recordSyncError(effectiveClassId, errMsg, env, authResult.token);
    return new Response(
      JSON.stringify({
        success: false,
        error: errMsg
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, private',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

export default {
  async fetch(request: Request, env: Env, ctx?: any): Promise<Response> {
    const url = new URL(request.url);

    // Gestion CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Route API de synchronisation Pronote
    if (url.pathname === '/api/pronote') {
      return handlePronoteSync(request, env, ctx);
    }

    // Fichiers statiques SPA (dist)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },

  // Tâche planifiée automatique Cloudflare Cron Trigger (toutes les 15 minutes)
  async scheduled(event: any, env: Env, ctx: any): Promise<void> {
    ctx.waitUntil(handleScheduledSync(env));
  }
};
