import { initializeDb } from "@workspace/db";
import app from "./app";

export default async (req: any, res: any) => {
  await initializeDb();
  return (app as any)(req, res);
};
