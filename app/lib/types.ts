export interface Organization {
  id: string;
  name: string;
  website: string;
  username: string;
  email: string;
  password: string;
  logo: string | null;
  dbUrl: string | null;
  createdAt: number | null;
  updatedAt: number | null;
}

export function makeOrganization(organization: any): Organization {
  return {
    id: organization.id,
    name: organization.name,
    website: organization.website,
    username: organization.username,
    email: organization.email,
    password: organization.password,
    logo: organization.logo,
    dbUrl: organization.db_url,
    createdAt: organization.createdAt,
    updatedAt: organization.updated_at,
  } as unknown as Organization;
}

export interface Agent {
  id: string;
  fullName: string;
  email: string;
  password: string;
  createdAt: number | null;
  updatedAt: number | null;
}

export function makeAgent(agent: any): Agent {
  if (agent.length === undefined) {
    return {
      id: agent.id,
      fullName: agent.full_name,
      email: agent.email,
      password: agent.password,
      createdAt: agent.created_at,
      updatedAt: agent.updated_at,
    } as unknown as Agent;
  }
  return {
    id: agent[0],
    fullName: agent[1],
    email: agent[2],
    password: agent[3],
    createdAt: agent[4],
    updatedAt: agent[5],
  } as unknown as Agent;
}

export interface Ticket {
  id: string;
  customerEmail: string;
  customerName: string;
  query: string;
  isClosed: number;
  serviceRating?: number;
  createdAt: number | null;
  updatedAt: number | null;
  conversation?: Conversation;
}

export function makeTicket(ticket: any): Ticket {
  if (ticket.length === undefined) {
    return {
      id: ticket.id,
      customerEmail: ticket.customer_email,
      customerName: ticket.customer_name,
      query: ticket.query || ticket.query,
      isClosed: ticket.is_closed,
      serviceRating: ticket.service_rating,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      conversation:
        ticket.conversation !== undefined && ticket.conversation !== null
          ? typeof ticket.conversation === "string"
            ? makeConversation(JSON.parse(ticket.conversation))
            : makeConversation(ticket.conversation)
          : undefined,
    } as unknown as Ticket;
  }
  return {
    id: ticket[0],
    customerEmail: ticket[1],
    customerName: ticket[2],
    query: ticket[3],
    isClosed: ticket[4],
    serviceRating: ticket[5],
    createdAt: ticket[6],
    updatedAt: ticket[7],
  } as unknown as Ticket;
}

export interface Conversation {
  id: string;
  ticketId: string;
  agentId: string;
  createdAt?: number | null;
  updatedAt?: number | null;
  ticket?: Ticket;
  agent?: Agent;
  messages?: Message[];
}

export function makeConversation(conversation: any): Conversation {
  if (conversation.length === undefined) {
    return {
      id: conversation.id,
      ticketId: conversation.ticket_id,
      agentId: conversation.agent_id,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      ticket:
        conversation.ticket !== undefined
          ? typeof conversation.ticket === "string"
            ? makeTicket(JSON.parse(conversation.ticket))
            : makeTicket(conversation.ticket)
          : undefined,
      agent:
        conversation.agent !== undefined
          ? typeof conversation.agent === "string"
            ? makeAgent(JSON.parse(conversation.agent))
            : makeAgent(conversation.agent)
          : undefined,
      messages:
        conversation.messages !== undefined
          ? typeof conversation.messages === "string"
            ? JSON.parse(conversation.messages).length > 0
              ? JSON.parse(conversation.messages).map((message: any) =>
                  makeMessage(message)
                )
              : []
            : makeTicket(conversation.ticket)
          : undefined,
    } as unknown as Conversation;
  }
  return {
    id: conversation[0],
    ticketId: conversation[1],
    agentId: conversation[2],
    createdAt: conversation[3],
    updatedAt: conversation[4],
  } as unknown as Conversation;
}

export interface Message {
  id: string;
  message: string;
  sender: string;
  conversationId: string;
  createdAt: number | null;
  updatedAt: number | null;
}

export function makeMessage(message: any): Message {
  if (message.length === undefined) {
    return {
      id: message.id,
      message: message.message,
      sender: message.sender,
      conversationId: message.conversation_id,
      createdAt: message.created_at,
      updatedAt: message.updated_at,
    } as unknown as Message;
  }
  return {
    id: message[0],
    sender: message[1],
    message: message[2],
    conversationId: message[3],
    createdAt: message[4],
    updatedAt: message[5],
  } as unknown as Message;
}
