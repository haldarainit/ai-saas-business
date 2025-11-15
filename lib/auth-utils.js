import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export function extractUserFromRequest(request) {
  try {
    // Try to get token from Authorization header
    const authHeader = request.headers.get("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      // Try to get token from cookies
      const cookies = request.headers.get("cookie");
      if (cookies) {
        const tokenMatch = cookies.match(/auth-token=([^;]+)/);
        if (tokenMatch) {
          token = tokenMatch[1];
        }
      }
    }

    if (!token) {
      return { success: false, error: "No authentication token found" };
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
      },
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return { success: false, error: "Invalid authentication token" };
  }
}

export function requireAuth(handler) {
  return async (request, ...args) => {
    const authResult = extractUserFromRequest(request);

    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    // Add user to request for handler to use
    request.user = authResult.user;
    return handler(request, ...args);
  };
}
