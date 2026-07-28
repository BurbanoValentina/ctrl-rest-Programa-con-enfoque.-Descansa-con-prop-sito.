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

const POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;

const userPool = new CognitoUserPool({
  UserPoolId: POOL_ID,
  ClientId: CLIENT_ID,
});

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
      resolve(null);
      return;
    }

    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
        return;
      }
      resolve(session.getIdToken().getJwtToken());
    });
  });
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

      user.getUserAttributes((attrErr, attributes) => {
        if (attrErr || !attributes) {
          resolve(null);
          return;
        }

        const email = attributes.find((a) => a.Name === "email")?.Value || "";
        const name = attributes.find((a) => a.Name === "name")?.Value || "";
        const sub = attributes.find((a) => a.Name === "sub")?.Value || "";

        resolve({ name, email, sub });
      });
    });
  });
}
