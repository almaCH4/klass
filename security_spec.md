# Spécification de Sécurité Firestore - Klass

## 1. Invariants de Données
1. **Identité Google certifiée** : L'accès en écriture requiert un jeton d'authentification valide avec `request.auth.token.email_verified == true`.
2. **Accès cloisonné par classe** :
   - Les élèves d'une classe ne peuvent lire que les cours, membres et journaux de leur propre classe (`user.classId == classId`).
   - Seuls les délégués titulaires (`DELEGATE`) et suppléants (`DEPUTY`) de la classe peuvent créer, modifier ou supprimer des cours, modifier les notes de classe et émettre des invitations.
3. **Événements personnels privés** :
   - Les événements personnels d'un utilisateur sous `/users/{userId}/personalEvents/{eventId}` sont strictement privés et inaccessibles aux autres élèves ou délégués.
4. **Intégrité de profil utilisateur** :
   - Un utilisateur ne peut pas s'auto-promouvoir délégué de façon arbitraire ; la création ou le changement de classe est régie par la validation du code d'invitation ou la création de classe.
5. **Défense en profondeur anti-poisoning** :
   - Tous les identifiants `{classId}`, `{courseId}`, `{userId}` respectent `isValidId()` avec un maximum de 128 caractères alphanumériques.
   - Les chaînes de caractères ont des bornes strictes de longueur (pas de payloads massifs).

## 2. Payloads de Test (« The Dirty Dozen »)
1. **D1: Injection d'ID corrompu** : Tenter d'écrire un cours avec un ID de 2 Ko contenant des caractères interdits. (Rejeté par `isValidId()`).
2. **D2: Élève tentant d'éditer un cours** : Requête de modification de cours par un `STUDENT` sans rôle de délégué. (Rejeté par vérification du rôle délégué dans la classe).
3. **D3: Élève d'une classe A tentant de lire les cours d'une classe B**. (Rejeté par le Master Gate).
4. **D4: Modification non autorisée d'un événement personnel d'un tiers**. (Rejeté car `request.auth.uid != userId`).
5. **D5: Émission d'invitation par un simple élève**. (Rejeté car réservé aux `DELEGATE` et `DEPUTY`).
6. **D6: Remplacement du champ immuable `classId` d'un cours existant**. (Rejeté par immutabilité `incoming().classId == existing().classId`).
7. **D7: Création d'utilisateur sans vérification e-mail** (`email_verified == false`). (Rejeté par `request.auth.token.email_verified == true`).
8. **D8: Champ fantôme ("Ghost field") injecté dans un profil utilisateur**. (Rejeté par validation stricte du schéma).
9. **D9: Injection d'une date invalide ou texte de 10 Ko dans un titre de cours**. (Rejeté par `val.size() <= 100`).
10. **D10: Suppression de journal d'audit par un utilisateur**. (Rejeté car les journaux d'audit sont immuables et non supprimables).
11. **D11: Usurpation d'identité d'un délégué lors de la modification de note**. (Rejeté par vérification `request.auth.uid in classDoc.data.delegateIds`).
12. **D12: Requête de liste sans filtre d'authentification valide**. (Rejeté par défaut `match /{document=**} { allow read, write: if false; }`).
