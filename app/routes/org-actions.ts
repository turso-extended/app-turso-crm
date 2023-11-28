import { type ActionFunctionArgs, json, redirect } from "@vercel/remix";
import bcrypt from "bcryptjs";
import { buildOrgDbClient } from "~/lib/client-org";
import {
  destroyOrganizationSession,
  getOrganizationDetails,
  requireOrganizationId,
} from "~/lib/session.server";
import { v4 as uuidv4 } from "uuid";
import { Delta } from "~/lib/utils";

export async function action({ request }: ActionFunctionArgs) {
  const organizationId = await requireOrganizationId({
    request,
    redirectTo: "/login",
  });

  if (organizationId === undefined) {
    return redirect("/login");
  }

  // get organization
  const currentOrganization = await getOrganizationDetails({
    organizationId: organizationId,
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

  const formData = await request.formData();
  const { _action, ...values } = Object.fromEntries(formData);

  if (_action === "onboardAgent") {
    const { full_name, email } = values as unknown as {
      full_name: string;
      email: string;
    };
    const id = uuidv4();
    const password = uuidv4().split("-")[0];
    const hash = await bcrypt.hash(password, 10);
    const agentInformation = [id, full_name, email, hash];

    //* add agent to db
    const t1 = new Delta();
    const agentAdded = await manageOrgDbs
      .prepare(
        "INSERT INTO agents(id, full_name, email, password) values(?, ?, ?, ?)"
      )
      .run(agentInformation);
    t1.stop("Creation of new agent");

    const t2 = new Delta();
    await manageOrgDbs.sync();
    t2.stop("syncing org database");

    if (agentAdded === undefined) {
      return json(
        {
          ok: true,
          message: "Something broke",
          information: { email, password },
        },
        { status: 204, statusText: "Failed to onboard agent" }
      );
    }

    // TODO: Send credentials to agent's email

    console.log({
      ok: true,
      message: "Agent added",
      data: { email, password },
    });
    return json(
      { ok: true, message: "Agent added", data: { email, password } },
      { status: 201, statusText: "Agent added" }
    );
  }

  if (_action === "logOut") {
    const agentId = await requireOrganizationId({
      request,
      redirectTo: `/agent/${currentOrganization.username}/login`,
    });
    if (agentId !== undefined) {
      return destroyOrganizationSession(`/login`);
    }
  }
}
