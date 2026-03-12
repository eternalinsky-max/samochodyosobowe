import prisma from "@/lib/prisma";
import { verifyIdTokenFromRequest } from "@/lib/firebase-admin";

export async function getCurrentPrismaUserFromRequest(req) {
  const auth = await verifyIdTokenFromRequest(req);
  if (!auth.ok) return auth;

  const me = await prisma.user.findUnique({
    where: { firebaseUid: auth.decoded.uid },
    select: {
      id: true,
      firebaseUid: true,
      email: true,
      displayName: true,
    },
  });

  if (!me) {
    return {
      ok: false,
      status: 401,
      error: "Użytkownik nie istnieje w bazie danych",
    };
  }

  return {
    ok: true,
    user: me,
    decoded: auth.decoded,
  };
}
