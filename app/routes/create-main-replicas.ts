// @ts-ignore
import { buildDbClient } from "~/lib/client";
import { buildOrgDbClient } from "~/lib/client-org";
import { tenantDbLocalPath } from "~/lib/utils";

export async function loader() {
  const db = buildDbClient();

  await db.sync();

  const organizations = await db.prepare("SELECT * FROM organizations").all();
  console.log("Added: databases/turso-crm.db ", {
    orgs: JSON.stringify({ organizations }),
  });

  for (const organization of organizations) {
    const orgDbClient = buildOrgDbClient({ url: organization.db_url });
    await orgDbClient.sync();
    console.log("Added: ", tenantDbLocalPath(organization.db_url));
  }

  return {
    ok: `Found ${organizations.length} organizations!`,
  };
}
