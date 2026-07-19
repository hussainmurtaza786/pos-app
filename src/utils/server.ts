import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

interface TokenPayload {
    id: string;
    email?: string;
    role?: string;
}

export async function verifyAuthorization(req: NextRequest) {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
        return decoded;
    } catch {
        throw new Error("Invalid or expired token");
    }
}
