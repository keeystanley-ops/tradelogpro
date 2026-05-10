import app from "../artifacts/api-server/src/app";
import { initializeDb } from "../lib/db/src/index";

export default async (req: any, res: any) => {
  await initializeDb();
  return (app as any)(req, res);
};
