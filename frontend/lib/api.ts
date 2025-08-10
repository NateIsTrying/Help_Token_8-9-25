const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiServiceClass {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('auth_token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  // User endpoints
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(userData: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getUserStats(userId: number) {
    return this.request(`/users/${userId}/stats`);
  }

  async getUserTransactions(userId: number) {
    return this.request(`/users/${userId}/transactions`);
  }

  // Opportunities endpoints
  async getOpportunities() {
    return this.request('/opportunities');
  }

  async getOpportunity(id: number) {
    return this.request(`/opportunities/${id}`);
  }

  async createOpportunity(opportunityData: any) {
    return this.request('/opportunities', {
      method: 'POST',
      body: JSON.stringify(opportunityData),
    });
  }

  // Marketplace endpoints
  async getMarketplaceItems() {
    return this.request('/marketplace');
  }

  async getMarketplaceItem(id: number) {
    return this.request(`/marketplace/${id}`);
  }

  // Verification endpoints
  async submitVolunteerSession(sessionData: any) {
    return this.request('/verify/session', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async verifySession(sessionId: number, verificationData: any) {
    return this.request(`/verify/session/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(verificationData),
    });
  }

  // Municipal admin endpoints
  async getMunicipalDashboard() {
    return this.request('/admin/dashboard');
  }

  async getMunicipalAnalytics() {
    return this.request('/admin/analytics');
  }

  async verifyUserIdentity(userId: number, verificationData: any) {
    return this.request(`/admin/users/${userId}/verify`, {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
  }

  async getAuditLogs() {
    return this.request('/admin/audit-logs');
  }
}

export const ApiService = new ApiServiceClass();