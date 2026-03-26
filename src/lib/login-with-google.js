import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export async function loginWithGoogle() {
  const auth = getAuth();

  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account",
  });

  const result = await signInWithPopup(auth, provider);

  const user = result.user;

  if (!user) throw new Error("No user");

  // 🔥 токен
  const token = await user.getIdToken(true);

  // 🔥 SAVE USER IN DB
  await fetch("/api/auth/me", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // 🔥 redirect
  window.location.href = "/my-cars";

  return user;
}