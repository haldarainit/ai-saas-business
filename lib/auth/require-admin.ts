import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { IUser } from "@/lib/models/User";

type RequireAdminSuccess = { ok: true; user: IUser };
type RequireAdminFailure = { ok: false; response: NextResponse };

export async function requireAdmin(
  request: Request
): Promise<RequireAdminSuccess | RequireAdminFailure> {
  const user = await getCurrentUser(request);

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, user };
}
