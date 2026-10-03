import { parseFullIcsContent } from '../src/utils/icsParser';

export interface Env {
  ICAL_URL?: string;
  FIREBASE_PROJECT_ID?: string;
  FIRESTORE_DATABASE_ID?: string;
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

/**
 * Base64URL decode helper
 */
function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

/**
 * Verifies the Firebase ID token and ensures the user is an active member of the class in Firestore.
 */
async function verifyFirebaseUserAndClass(
  authHeader: string | null,
  requestedClassId: string | null,
  env: Env
): Promise<{ valid: boolean; uid?: string; classId?: string; error?: string; status?: number }> {
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

  // Parse JWT parts
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

  // Validate standard Firebase claims
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

  // Query Firestore REST API with the user's Bearer token to verify membership in Firestore
  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users/${encodeURIComponent(uid)}`;
    const firestoreRes = await fetch(firestoreUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
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
      if (firestoreRes.status === 404) {
        return {
          valid: false,
          status: 403,
          error: 'Profil utilisateur introuvable dans la base de données de la classe.'
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
      classId: userClassId
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
 * Handles the /api/pronote endpoint.
 */
async function handlePronoteSync(
  request: Request,
  env: Env,
  ctx?: { waitUntil: (p: Promise<any>) => void }
): Promise<Response> {
  const url = new URL(request.url);
  const requestedClassId = url.searchParams.get('classId');

  // 1. Verify Firebase Auth and class membership
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

  // 2. Validate ICAL_URL secret configuration
  const icalUrl = env.ICAL_URL?.trim();
  if (!icalUrl || typeof icalUrl !== 'string') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Secret ICAL_URL non configuré. Allez dans Cloudflare Dashboard > Workers & Pages > votre Worker > Settings > Variables and Secrets > Secret et ajoutez ICAL_URL.'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, private',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  // 3. Server-side caching (15 minutes)
  const now = Date.now();
  let cache: any = null;
  let cacheKey: Request | null = null;

  try {
    // @ts-ignore
    if (typeof caches !== 'undefined' && caches.default) {
      // @ts-ignore
      cache = caches.default;
      cacheKey = new Request('https://worker-internal-cache/pronote-cleaned-json', { method: 'GET' });
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        const cachedJson = await cachedResponse.json();
        return new Response(JSON.stringify(cachedJson), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, private',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
  } catch (cacheErr) {
    console.warn('Server cache lookup error:', cacheErr);
  }

  // In-memory fallback cache
  if (inMemoryCache && now - inMemoryCache.timestamp < CACHE_TTL_MS) {
    return new Response(JSON.stringify(inMemoryCache.data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, private',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // 4. Fetch raw iCal from Pronote server-side
  try {
    const pronoteRes = await fetch(icalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/calendar, text/plain, */*'
      }
    });

    if (!pronoteRes.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Échec du téléchargement iCal Pronote (Code HTTP : ${pronoteRes.status}). Vérifiez le lien ICAL_URL dans Cloudflare.`
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
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Le serveur Pronote n\'a pas renvoyé de flux iCalendar valide.'
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

    // 5. Parse and clean data strictly on the Worker (removes headers X-WR-CALNAME, X-WR-CALDESC)
    const parsed = parseFullIcsContent(icsText, effectiveClassId);

    const resultPayload = {
      success: true,
      courses: parsed.courses,
      homework: parsed.homework,
      sessions: parsed.sessions,
      availableGroups: parsed.availableGroups,
      syncedAt: new Date().toISOString()
    };

    // 6. Save in server-side cache for 15 minutes
    inMemoryCache = {
      timestamp: now,
      data: resultPayload
    };

    if (cache && cacheKey) {
      try {
        const cacheStoreResponse = new Response(JSON.stringify(resultPayload), {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=900, s-maxage=900'
          }
        });
        if (ctx?.waitUntil) {
          ctx.waitUntil(cache.put(cacheKey, cacheStoreResponse));
        } else {
          await cache.put(cacheKey, cacheStoreResponse);
        }
      } catch (cacheStoreErr) {
        console.warn('Server cache store error:', cacheStoreErr);
      }
    }

    // 7. Return cleaned JSON to client with private, no-store
    return new Response(JSON.stringify(resultPayload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, private',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Impossible de joindre le serveur Pronote : ' + (err.message || 'Erreur réseau')
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

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Route /api/pronote to worker handler
    if (url.pathname === '/api/pronote') {
      return handlePronoteSync(request, env, ctx);
    }

    // Pass all other requests to static assets in ./dist
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
