/**
 * Servicio de autenticación con AWS Cognito
 * Usa amazon-cognito-identity-js para registro, login y manejo de tokens
 */
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

const POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || "";
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || "";

let userPool: CognitoUserPool;
try {
  userPool = new CognitoUserPool({
    UserPoolId: POOL_ID,
    ClientId: CLIENT_ID,
  });
} catch {
  // Si Cognito no está configurado, crear un pool dummy que no crashee la app
  userPool = new CognitoUserPool({
    UserPoolId: "us-east-1_PLACEHOLDER",
    ClientId: "placeholder",
  });
}

export interface AuthUser {
  name: string;
  email: string;
  sub: string;
}

/**
 * Registrar un nuevo usuario en Cognito
 * Después de esto, el usuario recibirá un código de confirmación por email
 */
export function signUp(
  name: string,
  email: string,
  password: string
): Promise<CognitoUser> {
  return new Promise((resolve, reject) => {
    const attributes = [
      new CognitoUserAttribute({ Name: "email", Value: email }),
      new CognitoUserAttribute({ Name: "name", Value: name }),
    ];

    userPool.signUp(email, password, attributes, [], (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result!.user);
    });
  });
}

/**
 * Confirmar registro con el código enviado por email
 */
export function confirmSignUp(email: string, code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

/**
 * Reenviar código de confirmación
 */
export function resendConfirmationCode(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.resendConfirmationCode((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * Iniciar sesión y obtener tokens JWT
 */
export function signIn(
  email: string,
  password: string
): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => {
        resolve(session);
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * Cerrar sesión
 */
export function signOut(): void {
  const user = userPool.getCurrentUser();
  if (user) {
    user.signOut();
  }
}

/**
 * Obtener el token JWT del usuario actual (si hay sesión activa)
 * Este es el token que se manda en el header Authorization
 */
export function getIdToken(): Promise<string | null> {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      // Fallback: leer directamente de localStorage
      const token = getIdTokenFromStorage();
      resolve(token);
      return;
    }

    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) {
        // Fallback: leer directamente de localStorage
        const token = getIdTokenFromStorage();
        resolve(token);
        return;
      }
      resolve(session.getIdToken().getJwtToken());
    });
  });
}

/**
 * Fallback: leer el idToken directamente de localStorage
 * Cognito SDK guarda los tokens con un key predecible
 */
function getIdTokenFromStorage(): string | null {
  const clientId = CLIENT_ID;
  const lastAuthUser = localStorage.getItem(
    `CognitoIdentityServiceProvider.${clientId}.LastAuthUser`
  );
  if (!lastAuthUser) return null;

  const token = localStorage.getItem(
    `CognitoIdentityServiceProvider.${clientId}.${lastAuthUser}.idToken`
  );
  return token || null;
}

/**
 * Obtener los datos del usuario actual desde la sesión
 */
export function getCurrentUser(): Promise<AuthUser | null> {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      resolve(null);
      return;
    }

    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
        return;
      }

      // Decodificar el idToken para obtener los datos del usuario
      const idToken = session.getIdToken();
      const payload = idToken.decodePayload();
      resolve({
        name: payload["name"] || "",
        email: payload["email"] || "",
        sub: payload["sub"] || "",
      });
    });
  });
}
