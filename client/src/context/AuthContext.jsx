import {
    createContext,
    useContext,
    useState
} from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const savedUser =
                localStorage.getItem('farmlink_user');

            return savedUser
                ? JSON.parse(savedUser)
                : null;

        } catch (error) {
            console.error(
                'Failed to restore user:',
                error
            );

            localStorage.removeItem(
                'farmlink_user'
            );

            localStorage.removeItem(
                'farmlink_token'
            );

            return null;
        }
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem(
            'farmlink_token'
        ) || null;
    });


    // ==========================
    // LOGIN
    // ==========================

    const login = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);

        localStorage.setItem(
            'farmlink_user',
            JSON.stringify(userData)
        );

        localStorage.setItem(
            'farmlink_token',
            userToken
        );
    };


    // ==========================
    // LOGOUT
    // ==========================

    const logout = () => {
        setUser(null);
        setToken(null);

        localStorage.removeItem(
            'farmlink_user'
        );

        localStorage.removeItem(
            'farmlink_token'
        );
    };


    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => {
    return useContext(AuthContext);
};