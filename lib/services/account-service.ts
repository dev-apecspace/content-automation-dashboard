import { Account } from "@/lib/types";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "@/lib/api/accounts";

export const AccountService = {
  getAccounts: async (): Promise<Account[]> => {
    return getAccounts();
  },

  createAccount: async (
    account: Omit<Account, "id" | "createdAt" | "updatedAt">
  ): Promise<Account> => {
    return createAccount(account);
  },

  updateAccount: async (
    id: string,
    updates: Partial<Omit<Account, "id" | "createdAt" | "updatedAt">>
  ): Promise<Account> => {
    return updateAccount(id, updates);
  },

  deleteAccount: async (id: string): Promise<void> => {
    return deleteAccount(id);
  },
};
