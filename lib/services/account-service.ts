import { Account } from "@/lib/types";

export const AccountService = {
  getAccounts: async (): Promise<Account[]> => {
    const res = await fetch("/api/accounts");
    if (!res.ok) throw new Error("Failed to fetch accounts");
    return res.json();
  },

  createAccount: async (
    account: Omit<Account, "id" | "createdAt" | "updatedAt">
  ): Promise<Account> => {
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(account),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to create account");
    }
    return res.json();
  },

  updateAccount: async (
    id: string,
    updates: Partial<Omit<Account, "id" | "createdAt" | "updatedAt">>
  ): Promise<Account> => {
    const res = await fetch("/api/accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to update account");
    }
    return res.json();
  },

  deleteAccount: async (id: string): Promise<void> => {
    const res = await fetch(`/api/accounts?id=${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to delete account");
    }
  },
};
