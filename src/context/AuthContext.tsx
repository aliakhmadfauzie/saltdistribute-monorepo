import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, UserRole, UserStatus } from "../types";
import {
  subscribeToUsers,
  fetchUsersFromFirestore,
  syncUserToFirestore,
} from "../services/firestoreService";

const AUTH_STORAGE_KEY = "@saltdistribute_auth_user";
const USERS_STORAGE_KEY = "@saltdistribute_users_list";

const INITIAL_USERS: User[] = [
  {
    userId: "usr_admin_001",
    username: "admin_jaya",
    password: "admin123",
    name: "Hendra Wijaya (Owner)",
    phoneNumber: "+628123456789",
    email: "admin@saltdistribute.id",
    role: "admin",
    status: "active",
    companyName: "PT SaltDistribute Indonesia",
    latitude: 3.7844,
    longitude: 98.6833,
    createdAt: "2026-08-01T00:00:00Z",
  },
  {
    userId: "usr_buyer_001",
    username: "client_jaya",
    password: "buyer123",
    name: "Budi Santoso",
    phoneNumber: "+628198765432",
    email: "buyer@saltdistribute.id",
    role: "buyer",
    status: "active",
    companyName: "PT Jaya Mandiri Pangan",
    address: "Jl. Industri Belawan No. 45, Medan",
    latitude: 3.7745,
    longitude: 98.681,
    deliveryZone: "KIM 1 / 2 / 3 & Belawan",
    createdAt: "2026-08-15T00:00:00Z",
  },
  {
    userId: "usr_buyer_002",
    username: "dapur_lestari",
    password: "siti123",
    name: "Siti Rahma",
    phoneNumber: "+628135557890",
    email: "siti@dapurlestari.co.id",
    role: "buyer",
    status: "active",
    companyName: "CV Dapur Lestari Utama",
    address: "Kawasan Industri Medan (KIM 2), Deli Serdang",
    latitude: 3.7042,
    longitude: 98.6912,
    deliveryZone: "KIM 1 / 2 / 3 & Belawan",
    createdAt: "2026-08-20T00:00:00Z",
  },
];

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  signIn: (identifier: string, pass: string) => Promise<User>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  registerBuyer: (data: Omit<User, "userId" | "role" | "status" | "createdAt">) => Promise<User>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  toggleUserStatus: (userId: string) => void;
  resetUserPassword: (userId: string) => void;
  switchUser: (role: UserRole) => void;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  allUsers: INITIAL_USERS,
  isLoading: true,
  signIn: async () => { throw new Error("Unimplemented"); },
  signOut: async () => {},
  logout: async () => {},
  registerBuyer: async () => { throw new Error("Unimplemented"); },
  updateProfile: async () => { throw new Error("Unimplemented"); },
  toggleUserStatus: () => {},
  resetUserPassword: () => {},
  switchUser: () => {},
  refreshUsers: async () => {},
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
          const parsed = JSON.parse(storedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAllUsers(parsed);
          } else {
            await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
            setAllUsers(INITIAL_USERS);
          }
        } else {
          await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
        }

        // On Web, only restore active session from sessionStorage (persists across minimization/tab switches, but resets on new link clicks)
        let storedUser: string | null = null;
        if (typeof window !== "undefined" && window.sessionStorage) {
          storedUser = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
        } else {
          storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        }

        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        console.warn("Error initializing auth", e);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();

    // Subscribe to Firestore users collection
    const unsub = subscribeToUsers((remoteUsers) => {
      if (remoteUsers && remoteUsers.length > 0) {
        setAllUsers(remoteUsers);
        AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(remoteUsers)).catch(() => {});
      }
    });

    return () => unsub();
  }, []);

  const refreshUsers = async () => {
    try {
      const remoteUsers = await fetchUsersFromFirestore();
      if (remoteUsers && remoteUsers.length > 0) {
        setAllUsers(remoteUsers);
        await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(remoteUsers));
      }
    } catch (err) {
      console.warn("[AuthContext] Refresh users warning:", err);
    }
  };

  const saveUsers = async (users: User[]) => {
    setAllUsers(users);
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const persistSession = async (user: User | null) => {
    if (user) {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      }
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
      }
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const signIn = async (identifier: string, pass: string): Promise<User> => {
    const trimmed = (identifier || "").trim().toLowerCase();
    const trimmedPass = (pass || "").trim();

    if (!trimmed || !trimmedPass) {
      throw new Error("Please enter both username/email and password.");
    }

    const user = allUsers.find(
      (u) =>
        (u.email && u.email.toLowerCase() === trimmed) ||
        (u.username && u.username.toLowerCase() === trimmed)
    );

    if (!user) {
      throw new Error("Invalid username/email or password.");
    }

    if (user.password && user.password !== trimmedPass) {
      throw new Error("Invalid username/email or password.");
    }

    if (user.status === "suspended") {
      throw new Error("Account has been suspended by Admin. Please contact WhatsApp support.");
    }

    setCurrentUser(user);
    await persistSession(user);
    return user;
  };

  const signOut = async () => {
    setCurrentUser(null);
    await persistSession(null);
  };

  const registerBuyer = async (data: Omit<User, "userId" | "role" | "status" | "createdAt">): Promise<User> => {
    const existing = allUsers.find(
      (u) =>
        (data.email && u.email.toLowerCase() === data.email.trim().toLowerCase()) ||
        (data.username && u.username.toLowerCase() === data.username.trim().toLowerCase())
    );
    if (existing) {
      throw new Error("An account with this email or username already exists.");
    }

    const newUser: User = {
      ...data,
      userId: `usr_buyer_${Date.now()}`,
      role: "buyer",
      status: "active",
      createdAt: new Date().toISOString(),
    };

    const updated = [newUser, ...allUsers];
    await saveUsers(updated);
    syncUserToFirestore(newUser).catch(() => {});
    setCurrentUser(newUser);
    await persistSession(newUser);
    return newUser;
  };

  const updateProfile = async (data: Partial<User>): Promise<User> => {
    if (!currentUser) throw new Error("No active user session");
    const updatedUser: User = {
      ...currentUser,
      ...data,
    };

    const updatedList = allUsers.map((u) => (u.userId === updatedUser.userId ? updatedUser : u));
    await saveUsers(updatedList);
    syncUserToFirestore(updatedUser).catch(() => {});
    setCurrentUser(updatedUser);
    await persistSession(updatedUser);
    return updatedUser;
  };

  const toggleUserStatus = (userId: string) => {
    let modifiedUser: User | null = null;
    const updated = allUsers.map((u) => {
      if (u.userId === userId) {
        const nextStatus: UserStatus = u.status === "active" ? "suspended" : "active";
        modifiedUser = { ...u, status: nextStatus };
        return modifiedUser;
      }
      return u;
    });
    saveUsers(updated);
    if (modifiedUser) {
      syncUserToFirestore(modifiedUser).catch(() => {});
    }
  };

  const resetUserPassword = (_userId: string) => {
    // Simulated credential reset notification
  };

  const switchUser = (role: UserRole) => {
    const target = allUsers.find((u) => u.role === role);
    if (target) {
      setCurrentUser(target);
      persistSession(target);
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
        logout: signOut,
        registerBuyer,
        updateProfile,
        toggleUserStatus,
        resetUserPassword,
        switchUser,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
