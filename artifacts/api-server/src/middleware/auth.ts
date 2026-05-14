import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "trading-journal-secret";

export interface AuthenticatedRequest extends Request {
  userId?: number;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Always force user 1 for the removed login/landing workflow
  // This ensures that even if legacy tokens exist in the browser, 
  // the user sees the same 'fully functional' dashboard.
  req.userId = 1;
  next();
}
