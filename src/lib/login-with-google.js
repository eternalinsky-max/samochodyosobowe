import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export async function loginWithGoogle() {
  try {
    const auth = getAuth();

    const provider = new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account",
    });

    const result = await signInWithPopup(auth, provider);

    // 🔥 user
    const user = result.user;

    if (!user) {
      throw new Error("No user returned from Google");
    }

    // 🔥 force refresh token (важливо!)
    await user.getIdToken(true);

    // 🔥 redirect після логіну
    window.location.href = "/my-cars";

    return user;

  } catch (error) {
    console.error("Google login error:", error);

    // ❗ важливо — норм UX
    if (error.code === "auth/popup-closed-by-user") {
      return;
    }

    alert("Nie udało się zalogować przez Google");
    throw error;
  }
}