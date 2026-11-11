import { apiClient } from "@/services/api";
import { CreateInvitationPayload, InvitationResponse } from "@/types/invitation";

export const invitationService = {
  /**
   * Invite a user to a tenant with Keycloak client role and required-action verification email
   * POST /tenants/{tenant_id}/invitations
   */
  async inviteUser(
    tenantId: string,
    payload: CreateInvitationPayload
  ): Promise<InvitationResponse> {
    const response = await apiClient.post<InvitationResponse>(
      `/tenants/${encodeURIComponent(tenantId)}/invitations`,
      payload
    );
    return response.data;
  },
};

