import { type ActionFunctionArgs, json } from "@vercel/remix";
import { buildOrgDbClient } from "~/lib/client-org";
import { v4 as uuidv4 } from "uuid";
import { Delta } from "~/lib/utils";
import { getOrganizationDetails } from "~/lib/session.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { _action, ...values } = Object.fromEntries(formData);

  if (values.organization_username === undefined) {
    return json(
      { ok: false, message: "Organization username not found" },
      { status: 422, statusText: "Unknown organization!" }
    );
  }

  // get organization
  const t0 = new Delta();
  const currentOrganization = await getOrganizationDetails({
    organizationUsername: values.organization_username as string,
  });
  t0.stop("Fetching single organization");

  if (currentOrganization === undefined) {
    return json(
      { ok: false, message: "Organization not found" },
      { status: 422, statusText: "Could not fetch organization's information!" }
    );
  }

  const manageOrgDbs = buildOrgDbClient({
    url: currentOrganization.dbUrl as string,
  });

  if (_action === "sendMessage") {
    const { sender, conversation_id, message } = values as unknown as {
      sender: "agent" | "customer";
      conversation_id: string;
      message: string;
    };

    const id = uuidv4();
    const messageInformation = [id, sender, message, conversation_id];

    //* submit a message
    const t1 = new Delta();
    await manageOrgDbs
      .prepare(
        "INSERT INTO messages(id, sender, message, conversation_id) VALUES(?, ?, ?, ?)"
      )
      .run(messageInformation);
    t1.stop("Creating a new message");

    const t2 = new Delta();
    manageOrgDbs.sync();
    t2.stop("Synchronizing messages");

    const t3 = new Delta();
    const messageSubmitted = await manageOrgDbs
      .prepare("SELECT * FROM messages WHERE id = ?")
      .get(id);
    t3.stop("Fetching created message");

    if (messageSubmitted === undefined) {
      return json(
        {
          ok: true,
          message: "Something broke",
        },
        { status: 204, statusText: "Failed to submit message" }
      );
    }

    return json(
      { ok: true, message: "Message submitted" },
      { status: 201, statusText: "Message submitted" }
    );
  }
}
