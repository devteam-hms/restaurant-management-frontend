export interface CreateInvitationPayload {
  email: string;
  full_name: string;
  role: "MANAGER" | "STAFF" | "CUSTOMER" | string;
  restaurant_id?: string | null;
  branch_id?: string | null;
}

export interface InvitationResponse {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  restaurant_id?: string | null;
  branch_id?: string | null;
  status: string;
  invited_by: string;
  expires_at: string;
  created_at: string;
  message: string;
}

