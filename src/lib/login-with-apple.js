import { getAuth, OAuthProvider, signInWithPopup } from "firebase/auth";

export async function loginWithApple() {
  const auth = getAuth();

  const provider = new OAuthProvider("apple.com");

  provider.addScope("email");
  provider.addScope("name");

  return await signInWithPopup(auth, provider);
}

