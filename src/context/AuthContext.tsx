import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, UserRole, UserStatus } from "../types";

const AUTH_STORAGE_KEY = "@saltdistribute_auth_user";
const USERS_STORAGE_KEY = "@saltdistribute_users_list";

const INITIAL_USERS: User[] = [
  {
    userId: "usr_admin_001",
    username: "admin_jaya",
    name: "Hendra Wijaya (Owner)",
    phoneNumber: "+628123456789",
    email: "admin@saltdistribute.id",
    role: "admin",
    status: "active",
    companyName: "PT SaltDistribute Indonesia",
    createdAt: "2026-08-01T00:00:00Z",
  },
  {
    userId: "usr_buyer_001",
    username: "client_jaya",
    name: "Budi Santoso",
    phoneNumber: "+628198765432",
    email: "buyer@saltdistribute.id",
    role: "buyer",
    status: "active",
    companyName: "PT Jaya Mandiri Pangan",
    address: "Jl. Industri Belawan No. 45, Medan",
    createdAt: "2026-08-15T00:00:00Z",
  },
  {
    userId: "usr_buyer_002",
    username: "dapur_lestari",
    name: "Siti Rahma",
    phoneNumber: "+628135557890",
    email: "siti@dapurlestari.co.id",
    role: "buyer",
    status: "active",
    companyName: "CV Dapur Lestari Utama",
    address: "Kawasan Industri Medan (KIM 2), Deli Serdang",
    createdAt: "2026-08-20T00:00:00Z",
  },
];

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<User>;
  signOut: () => Promise<void>;
  registerBuyer: (data: Omit<User, "userId" | "role" | "status" | "createdAt">) => Promise<User>;
  toggleUserStatus: (userId: string) => void;
  resetUserPassword: (userId: string) => void;
  switchUser: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  allUsers: INITIAL_USERS,
  isLoading: true,
  signIn: async () => { throw new Error("Unimplemented"); },
  signOut: async () => {},
  registerBuyer: async () => { throw new Error("Unimplemented"); },
  toggleUserStatus: () => {},
  resetUserPassword: () => {},
  switchUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const storedUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
          setAllUsers(JSON.parse(storedUsers));
        } else {
          await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
        }

        const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        } else {
          // Default to Buyer user for instant testing
          const defaultBuyer = INITIAL_USERS[1];
          setCurrentUser(defaultBuyer);
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultBuyer));
        }
      } catch (e) {
        console.warn("Error initializing auth", e);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const saveUsers = async (users: User[]) => {
    setAllUsers(users);
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const signIn = async (email: string, _pass: string): Promise<User> => {
    const trimmed = email.trim().toLowerCase();
    const user = allUsers.find((u) => u.email.toLowerCase() === trimmed);
    if (!user) {
      throw new Error("Invalid email or user not found.");
    }
    if (user.status === "suspended") {
      throw new Error("Account has been suspended by Admin. Please contact WhatsApp support.");
    }

    setCurrentUser(user);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return user;
  };

  const signOut = async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const registerBuyer = async (data: Omit<User, "userId" | "role" | "status" | "createdAt">): Promise<User> => {
    const newUser: User = {
      ...data,
      userId: `usr_buyer_${Date.now()}`,
      role: "buyer",
      status: "active",
      createdAt: new Date().toISOString(),
    };

    const updated = [newUser, ...allUsers];
    await saveUsers(updated);
    setCurrentUser(newUser);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  };

  const toggleUserStatus = (userId: string) => {
    const updated = allUsers.map((u) => {
      if (u.userId === userId) {
        const nextStatus: UserStatus = u.status === "active" ? "suspended" : "active";
        return { ...u, status: nextStatus };
      }
      return u;
    });
    saveUsers(updated);
  };

  const resetUserPassword = (_userId: string) => {
    // Simulated credential reset notification
  };

  const switchUser = (role: UserRole) => {
    const target = allUsers.find((u) => u.role === role);
    if (target) {
      setCurrentUser(target);
      AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(target));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isLoading,
        signIn,
        signOut,
        registerBuyer,
        toggleUserStatus,
        resetUserPassword,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
