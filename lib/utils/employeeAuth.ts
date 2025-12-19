import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Client-side auth utilities
export const employeeAuth = {
    // Store JWT token
    setToken(token: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('employee_token', token);
        }
    },

    // Get JWT token
    getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('employee_token');
        }
        return null;
    },

    // Remove JWT token
    removeToken() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('employee_token');
            localStorage.removeItem('employee_data');
        }
    },

    // Store employee data
    setEmployeeData(data: any) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('employee_data', JSON.stringify(data));
        }
    },

    // Get employee data
    getEmployeeData(): any | null {
        if (typeof window !== 'undefined') {
            const data = localStorage.getItem('employee_data');
            return data ? JSON.parse(data) : null;
        }
        return null;
    },

    // Check if user is authenticated
    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;

        try {
            const decoded = jwt.decode(token);
            if (!decoded || typeof decoded === 'string') return false;

            const payload = decoded as JwtPayload;
            if (!payload.exp) return false;

            // Check if token is expired
            return payload.exp * 1000 > Date.now();
        } catch (error) {
            return false;
        }
    },

    // Decode token
    decodeToken(): string | JwtPayload | null {
        const token = this.getToken();
        if (!token) return null;

        try {
            return jwt.decode(token);
        } catch (error) {
            return null;
        }
    },

    // Logout
    logout() {
        this.removeToken();
        if (typeof window !== 'undefined') {
            // Trigger auth context update
            window.dispatchEvent(new Event('employeeAuthChange'));
            window.location.href = '/portal/login';
        }
    },

    // API call wrapper with auth header
    async apiCall(endpoint: string, options: RequestInit = {}) {
        const token = this.getToken();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(endpoint, {
            ...options,
            headers,
        });

        // If unauthorized, redirect to login
        if (response.status === 401) {
            this.logout();
            throw new Error('Session expired. Please login again.');
        }

        return response;
    },
};
