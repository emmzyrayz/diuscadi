import { Db, Collection } from "mongodb";
import { VaultDocument } from "@/lib/models/vault";
import { UserDataDocument } from "@/lib/models/UserData";
import { SessionDocument } from "@/lib/models/session";

export const Collections = {
  vault: (db: Db): Collection<VaultDocument> =>
    db.collection<VaultDocument>("vault"),
  userData: (db: Db): Collection<UserDataDocument> =>
    db.collection<UserDataDocument>("userData"),
  sessions: (db: Db): Collection<SessionDocument> =>
    db.collection<SessionDocument>("sessions"),
};