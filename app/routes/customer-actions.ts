import { type ActionFunctionArgs, json } from "@vercel/remix";
import { buildOrgDbClient } from "~/lib/client-org";
import { v4 as uuidv4 } from "uuid";
import { Delta, dateToUnixepoch } from "~/lib/utils";
import { getOrganizationDetails } from "~/lib/session.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { _action, ...values } = Object.fromEntries(formData);

  // get organization
  const currentOrganization = await getOrganizationDetails({
    organizationUsername: values.organization_username as string,
  });

  if (currentOrganization === undefined) {
    return json(
      { ok: false, message: "Organization not found" },
      { status: 422, statusText: "Could not fetch organization's information!" }
    );
  }

  const manageOrgDbs = buildOrgDbClient({
    url: currentOrganization.dbUrl as string,
  });

  if (_action === "openTicket") {
    const { customer_email, customer_name, query } = values as unknown as {
      customer_email: string;
      customer_name: string;
      query: string;
    };

    const id = uuidv4();

    const ticketInformation = [id, customer_email, customer_name, query, 0];

    //* open a ticket
    const t1 = new Delta();
    await manageOrgDbs
      .prepare(
        "INSERT INTO tickets(id, customer_email, customer_name, query, is_closed) values(?, ?, ?, ?, ?)"
      )
      .run(ticketInformation);
    t1.stop("Creating a new ticket");

    const t2 = new Delta();
    await manageOrgDbs.sync();
    t2.stop("Syncronization");

    const t3 = new Delta();
    const openedTicket = await manageOrgDbs
      .prepare("SELECT * FROM tickets WHERE id = ?")
      .get(id);
    t3.stop("Fetching created ticket");

    if (openedTicket === undefined) {
      return json(
        {
          ok: true,
          message: "Something broke",
        },
        { status: 204, statusText: "Failed to create ticket" }
      );
    }

    // TODO: Send email to organization with ticket details

    return json(
      {
        ok: true,
        message:
          "Ticket opened, you will get a response in your email with further instructions",
      },
      { status: 201, statusText: "Ticket created" }
    );
  }

  if (_action === "rateConversation") {
    const { ticket_id, rating } = values as unknown as {
      ticket_id: string;
      rating: number;
    };

    if (ticket_id === "" || ticket_id === undefined || rating === undefined) {
      return json(
        {
          ok: false,
          message: "Missing credentials",
        },
        { status: 422, statusText: "Missing credentials" }
      );
    }

    const udpateTicket = await manageOrgDbs
      .prepare(
        "UPDATE tickets SET service_rating = ?, updated_at = ? WHERE id = ?"
      )
      .run([rating, dateToUnixepoch(), ticket_id]);

    if (udpateTicket === undefined) {
      return json(
        {
          ok: true,
          message: "Something broke",
        },
        { status: 204, statusText: "Failed to rate ticket" }
      );
    }

    return json(
      { ok: true, message: "Ticket rated" },
      { status: 201, statusText: "Ticket rated" }
    );
  }
}
