"use client";

import React, { createContext, useContext, ReactNode } from "react";

// Mock Convex context
const MockConvexContext = createContext<any>(null);

export function MockConvexProvider({ children }: { children: ReactNode }) {
  return (
    <MockConvexContext.Provider value={{}}>
      {children}
    </MockConvexContext.Provider>
  );
}

// Mock useQuery hook
export function useQuery(query: any, args?: any) {
  return undefined;
}

// Mock useMutation hook
export function useMutation(mutation: any) {
  return async (args: any) => {
    console.log("Mock mutation called:", mutation, args);
    return { success: true };
  };
}

// Mock useAction hook
export function useAction(action: any) {
  return async (args: any) => {
    console.log("Mock action called:", action, args);
    return { success: true };
  };
}

// Mock useAuthActions hook
export function useAuthActions() {
  return {
    signIn: async (provider: string, args: any) => {
      console.log("Mock sign in:", provider, args);
      // Simulate successful login
      localStorage.setItem("mockUser", JSON.stringify({ email: args.email, name: args.name }));
      return { success: true };
    },
    signOut: async () => {
      console.log("Mock sign out");
      localStorage.removeItem("mockUser");
      return { success: true };
    },
  };
}

// Mock useConvexAuth hook
export function useConvexAuth() {
  const user = typeof window !== "undefined" ? localStorage.getItem("mockUser") : null;
  return {
    isLoading: false,
    isAuthenticated: !!user,
    user: user ? JSON.parse(user) : null,
  };
}
