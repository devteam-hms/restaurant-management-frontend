export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  loyalty_tier?: 'Gold' | 'Platinum' | 'RMS Privilege Member' | 'Platinum Club';
  dining_preferences?: string[];
  total_orders?: number;
  total_spent?: number;
  member_since?: string;
  address?: string;
  city?: string;
}

export interface UpdateCustomerProfilePayload {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  dining_preferences?: string[];
}

