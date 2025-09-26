import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Account, Tag, AccountType, ValidationErrors } from '@/types';

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>([]);

  const loadAccountsFromStorage = () => {
    const stored = localStorage.getItem('accounts');
    if (stored) {
      try {
        accounts.value = JSON.parse(stored);
      } catch (error) {
        console.error('Ошибка загрузки учетных записей из localStorage:', error);
        accounts.value = [];
      }
    }
  };

  const saveAccountsToStorage = () => {
    localStorage.setItem('accounts', JSON.stringify(accounts.value));
  };

  const parseTags = (tagsString: string): Tag[] => {
    if (!tagsString.trim()) return [];
    return tagsString
      .split(';')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => ({ text: tag }));
  };

  const tagsToString = (tags: Tag[]): string => {
    return tags.map(tag => tag.text).join(';');
  };

  const validateAccount = (account: Account): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!account.login.trim()) {
      errors.login = 'Логин обязателен для заполнения';
    } else if (account.login.length > 100) {
      errors.login = 'Логин не должен превышать 100 символов';
    }

    if (account.type === 'Локальная') {
      if (!account.password || !account.password.trim()) {
        errors.password = 'Пароль обязателен для заполнения';
      } else if (account.password.length > 100) {
        errors.password = 'Пароль не должен превышать 100 символов';
      }
    }

    return errors;
  };


  const addAccount = () => {
    const newAccount: Account = {
      id: Date.now().toString(),
      tags: [],
      type: 'Локальная',
      login: '',
      password: ''
    };
    accounts.value.push(newAccount);
    saveAccountsToStorage();
    return newAccount;
  };

  const updateAccount = (accountId: string, updates: Partial<Account>) => {
    const accountIndex = accounts.value.findIndex(acc => acc.id === accountId);
    if (accountIndex !== -1) {
      accounts.value[accountIndex] = { ...accounts.value[accountIndex], ...updates };

      if (updates.type === 'LDAP') {
        accounts.value[accountIndex].password = null;
      }

      saveAccountsToStorage();
    }
  };

  const deleteAccount = (accountId: string) => {
    const accountIndex = accounts.value.findIndex(acc => acc.id === accountId);
    if (accountIndex !== -1) {
      accounts.value.splice(accountIndex, 1);
      saveAccountsToStorage();
    }
  };

  const getAccountById = (accountId: string) => {
    return accounts.value.find(acc => acc.id === accountId);
  };

  loadAccountsFromStorage();

  return {
    accounts: computed(() => accounts.value),
    parseTags,
    tagsToString,
    validateAccount,
    addAccount,
    updateAccount,
    deleteAccount,
    getAccountById
  };
});
