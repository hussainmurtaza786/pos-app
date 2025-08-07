import { NextRequest } from "next/server";
import * as jwt from "jsonwebtoken";
// import { AdminUser, Buyer, SalesMan } from "@prisma/client";
import prisma from "@/prisma/client";
import { User, UserRole } from "@prisma/client";

/** Match for YYYY-MM-DD */
export const DATE_REGEXP = /^\d{4}-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])$/;

export function parseQueryParams(req: NextRequest) {
    const obj: any = {}
    req.nextUrl.searchParams.forEach((value, key) => {
        obj[key] = value;
    })
    return obj
}

interface JWTPayload {
    id: string;
    userRole: UserRole;
}
export class JWT {
    static SECRET = process.env.JWT_SECRET!;

    static sign(payload: JWTPayload, options?: jwt.SignOptions) {
        return jwt.sign(payload, JWT.SECRET, options);
    }

    static verify<T = JWTPayload>(token: string): T {
        return jwt.verify(token, JWT.SECRET) as T;
    }

    static decode<T = JWTPayload>(token: string): T & jwt.JwtPayload {
        return jwt.decode(token) as T & jwt.JwtPayload;
    }
}

// export async function verifyAuthorization(
//     headers: Headers,
//     authorizedRoles: UserRole[]
// ): Promise<Omit<User, 'password'>> {
//     const authHeader = headers.get('authorization') || headers.get('Authorization');

//     if (!authHeader) {
//         throw new Error('No authorization token provided');
//     }

//     const token = authHeader.split(' ')[1]; // Bearer <token>
//     if (!token) {
//         throw new Error('Malformed authorization header');
//     }

//     try {
//         const decoded = JWT.verify<{ id: string; userRole: UserRole }>(token);

//         if (!authorizedRoles.includes(decoded.userRole)) {
//             throw new Error('You are not authorized to access this resource');
//         }

//         const user = await prisma.user.findUnique({
//             where: { id: decoded.id },
//         });

//         if (!user) {
//             throw new Error('User does not exist');
//         }

//         const { password, ...userWithoutPassword } = user;
//         return userWithoutPassword;
//     } catch (err: any) {
//         console.error('verifyAuthorization error:', err);
//         throw new Error('Unauthorized');
//     }
// }

// export async function verifyAuthorization<T>(
//     headers: Headers,
//     authorizeUserType: (User['userRole'])[]
// ): Promise<
//     T extends "Admin" ? User :
//     User
// > {

//     const token = headers.get('Authorization') || headers.get('authorization');

//     if (!token) throw new Error('No authorization token provided.');

//     const JWTtoken = token.split(' ')[1];

//     if (!JWTtoken) throw new Error('No authorization token provided.');

//     try {
//         let decodedToken = JWT.verify(JWTtoken);
//         if (!authorizeUserType.includes(decodedToken.type)) {
//             throw new Error('You are not authorized to access this API');
//         }
//         if (decodedToken.type === "Admin") {
//             // decodedToken.access = await prisma.adminUserAccess.findUnique({ where: { adminUserId: decodedToken.id } }) || {} as any
//             const userDetails = await prisma.user.findUnique({ where: { id: decodedToken.id }, omit: { password: true }, include: { access: true } })
//             if (!userDetails) throw new Error('User is no more. You are not authorized to access this API');
//             decodedToken = {
//                 ...decodedToken,
//                 ...userDetails as any,
//             }
//         }
//         return decodedToken as any
//     } catch (e: any) {
//         console.log('verifyAuthorization.error =>', e);
//         throw e;
//     }

// }


export function generateUniqueNumber() {
    return Math.floor(10000000 + Math.random() * 90000000)
}