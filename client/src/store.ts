import { create } from 'zustand';

export type Setting = {
  id: string;
  name: string;
  type: 'boolean' | 'string' | 'select';
  options?: string[];
};

export type Module = {
  id: string;
  title: string;
  description: string;
  price: number;
  settings?: Setting[];
};

export const AVAILABLE_MODULES: Module[] = [
  { 
    id: 'admin', 
    title: 'Админ-панель', 
    description: 'Управление пользователями, массовые рассылки и базовая статистика.', 
    price: 50,
    settings: [
      { id: 'db_type', name: 'Тип базы данных', type: 'select', options: ['PostgreSQL', 'SQLite'] },
      { id: 'auth_required', name: 'Защита админки паролем', type: 'boolean' }
    ]
  },
  { 
    id: 'cart', 
    title: 'Корзина и Каталог', 
    description: 'Оформление заказов, категории товаров и интеграция оплаты.', 
    price: 70,
    settings: [
      { id: 'currency', name: 'Основная валюта', type: 'select', options: ['USD', 'EUR', 'RUB'] }
    ]
  },
  { 
    id: 'ai', 
    title: 'AI-Поддержка', 
    description: 'Интеграция с OpenAI для автоматических ответов клиентам.', 
    price: 120,
    settings: [
      { id: 'ai_model', name: 'Модель нейросети', type: 'select', options: ['GPT-4o', 'GPT-3.5-Turbo'] },
      { id: 'system_prompt', name: 'Системный промпт', type: 'string' }
    ]
  },
  { 
    id: 'referral', 
    title: 'Реферальная система', 
    description: 'Многоуровневая партнерская программа для вирусного роста.', 
    price: 60 
  }
];

interface User {
  name: string;
  is_verified: boolean;
}

type AuthStep = 'cart' | 'login' | 'register' | 'verify_wait' | 'questionnaire';

interface BotStore {
  cart: string[];
  moduleSettings: Record<string, Record<string, any>>;
  activeModule: Module | null;
  
  // Состояние воронки и авторизации
  isCheckoutOpen: boolean;
  authStep: AuthStep;
  token: string | null;
  user: User | null;
  
  toggleModule: (id: string) => void;
  setActiveModule: (module: Module | null) => void;
  updateSetting: (moduleId: string, settingId: string, value: any) => void;
  
  setCheckoutOpen: (isOpen: boolean) => void;
  setAuthStep: (step: AuthStep) => void;
  loginState: (token: string, user: User) => void;
  logoutState: () => void;
}

export const useBotStore = create<BotStore>((set) => ({
  cart: [],
  moduleSettings: {},
  activeModule: null,
  
  isCheckoutOpen: false,
  authStep: 'cart',
  token: localStorage.getItem('token') || null,
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null,

  toggleModule: (id) => set((state) => ({
    cart: state.cart.includes(id) 
      ? state.cart.filter(mId => mId !== id)
      : [...state.cart, id]
  })),

  setActiveModule: (module) => set({ activeModule: module }),

  updateSetting: (moduleId, settingId, value) => set((state) => ({
    moduleSettings: {
      ...state.moduleSettings,
      [moduleId]: {
        ...(state.moduleSettings[moduleId] || {}),
        [settingId]: value
      }
    }
  })),

  setCheckoutOpen: (isOpen) => set({ isCheckoutOpen: isOpen, authStep: 'cart' }),
  setAuthStep: (step) => set({ authStep: step }),
  
  loginState: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  
  logoutState: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, authStep: 'cart' });
  }
}));