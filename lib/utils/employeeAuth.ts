import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Client-side auth utilities
export const employeeAuth = {
    // Store JWT token
    setToken(token: string) {
        if (typeof window !== 'undefined') {
            console.log('Setting employee token:', token);
            try {
                localStorage.setItem('employee_token', token);
                // Also store in sessionStorage as backup
                sessionStorage.setItem('employee_token', token);
                console.log('Token stored in localStorage:', localStorage.getItem('employee_token'));
                console.log('Token stored in sessionStorage:', sessionStorage.getItem('employee_token'));
            } catch (error) {
                console.error('Error storing token:', error);
                // Fallback to sessionStorage only
                try {
                    sessionStorage.setItem('employee_token', token);
                    console.log('Fallback: Token stored in sessionStorage only');
                } catch (sessionError) {
                    console.error('Cannot store token anywhere:', sessionError);
                }
            }
        } else {
            console.log('Cannot set token - window is undefined');
        }
    },

    // Get JWT token
    getToken(): string | null {
        if (typeof window !== 'undefined') {
            try {
                let token = localStorage.getItem('employee_token');
                if (!token) {
                    // Fallback to sessionStorage
                    token = sessionStorage.getItem('employee_token');
                    console.log('Token from sessionStorage fallback:', token);
                }
                console.log('Getting employee token:', token);
                return token;
            } catch (error) {
                console.error('Error getting token:', error);
                return null;
            }
        }
        console.log('Cannot get token - window is undefined');
        return null;
    },

    // Remove JWT token
    removeToken() {
        if (typeof window !== 'undefined') {
            console.log('REMOVING TOKENS - Stack trace:');
            console.trace();
            localStorage.removeItem('employee_token');
            localStorage.removeItem('employee_data');
            sessionStorage.removeItem('employee_token');
            sessionStorage.removeItem('employee_data');
            console.log('All employee tokens and data removed');
        }
    },

    // Store employee data
    setEmployeeData(data: any) {
        if (typeof window !== 'undefined') {
            console.log('Setting employee data:', data);
            try {
                const dataStr = JSON.stringify(data);
                localStorage.setItem('employee_data', dataStr);
                // Also store in sessionStorage as backup
                sessionStorage.setItem('employee_data', dataStr);
                console.log('Data stored in localStorage:', localStorage.getItem('employee_data'));
                console.log('Data stored in sessionStorage:', sessionStorage.getItem('employee_data'));
            } catch (error) {
                console.error('Error storing employee data:', error);
                // Fallback to sessionStorage only
                try {
                    sessionStorage.setItem('employee_data', JSON.stringify(data));
                    console.log('Fallback: Data stored in sessionStorage only');
                } catch (sessionError) {
                    console.error('Cannot store data anywhere:', sessionError);
                }
            }
        } else {
            console.log('Cannot set employee data - window is undefined');
        }
    },

    // Get employee data
    getEmployeeData(): any | null {
        if (typeof window !== 'undefined') {
            try {
                let data = localStorage.getItem('employee_data');
                if (!data) {
                    // Fallback to sessionStorage
                    data = sessionStorage.getItem('employee_data');
                    console.log('Data from sessionStorage fallback:', data);
                }
                console.log('Getting employee data:', data);
                return data ? JSON.parse(data) : null;
            } catch (error) {
                console.error('Error getting employee data:', error);
                return null;
            }
        }
        console.log('Cannot get employee data - window is undefined');
        return null;
    },

    // Check if user is authenticated
    isAuthenticated(): boolean {
        if (typeof window === 'undefined') return false;
        
        const token = this.getToken();
        const data = this.getEmployeeData();
        
        // Simple check: if we have both token and data, consider authenticated
        // JWT verification should be done server-side, not client-side
        return !!(token && data);
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
