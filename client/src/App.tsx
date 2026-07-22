import { Bot, ShoppingCart, Check, Plus, X, Settings, Download, Loader2, User as UserIcon, Lock, Mail, ArrowRight, LogOut, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { useBotStore, AVAILABLE_MODULES } from './store'
import type { Module, Setting } from './store'

function App() {
  const { 
    cart, toggleModule, activeModule, setActiveModule, 
    moduleSettings, updateSetting, isCheckoutOpen, setCheckoutOpen,
    authStep, setAuthStep, token, user, loginState, logoutState
  } = useBotStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  
  // Формы
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(''); // Стейт для 6-значного кода
  const [role, setRole] = useState('');
  const [purpose, setPurpose] = useState('');

  const totalPrice = AVAILABLE_MODULES
    .filter(m => cart.includes(m.id))
    .reduce((sum, m) => sum + m.price, 0);

  const handleConfirmSettings = () => {
    if (activeModule) {
      if (!cart.includes(activeModule.id)) {
        toggleModule(activeModule.id);
      }
      setActiveModule(null);
    }
  };

  const handleRegister = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      if (!res.ok) throw new Error('Ошибка регистрации');
      // Если успешно - перекидываем на экран ввода кода
      setAuthStep('verify_wait');
    } catch (err) {
      alert('Пользователь с такой почтой уже существует или произошла ошибка.');
    } finally {
      setAuthLoading(false);
    }
  };

  // НОВЫЙ ЭНДПОИНТ: ПРОВЕРКА 6-ЗНАЧНОГО КОДА
  const handleVerifyOTP = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || 'Неверный код');
      
      // Бэкенд сразу отдает боевой токен! Логиним юзера бесшовно.
      loginState(data.token, { name: data.name, is_verified: data.is_verified });
      setAuthStep('questionnaire');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      
      loginState(data.token, { name: data.name, is_verified: data.is_verified });
      
      if (!data.is_verified) {
        setAuthStep('verify_wait');
      } else {
        setAuthStep('questionnaire');
      }
    } catch (err) {
      alert('Неверная почта или пароль.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCheckoutAndGenerate = async () => {
    if (!token) return;
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cart, moduleSettings })
      });

      if (response.status === 403) throw new Error('Почта не подтверждена');
      if (!response.ok) throw new Error('Ошибка генерации');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'bot_asset.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      setCheckoutOpen(false);
    } catch (error: any) {
      alert(error.message || 'Произошла ошибка при сборке архива.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinueFromCart = () => {
    if (token && user?.is_verified) {
      setAuthStep('questionnaire');
    } else if (token && !user?.is_verified) {
      setAuthStep('verify_wait');
    } else {
      setAuthStep('register');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20 relative">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-md shadow-blue-200">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">BotBuilder <span className="text-blue-600">Pro</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-600 border-r border-gray-200 pr-4">
                <UserIcon className="w-4 h-4" />
                {user.name}
                <button onClick={logoutState} className="ml-2 hover:text-red-500 transition-colors" title="Выйти из аккаунта">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
            <button 
              onClick={() => setCheckoutOpen(true)}
              disabled={cart.length === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${cart.length > 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>{cart.length} модулей</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-gray-900">
            Собери идеального Telegram-бота
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Бесплатный тест-драйв архитектуры. Выбирай функции, регистрируйся и скачивай готовый ZIP-архив с кодом.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AVAILABLE_MODULES.map((module: Module) => {
            const isSelected = cart.includes(module.id);
            const hasSettings = module.settings && module.settings.length > 0;
            return (
              <div key={module.id} onClick={() => {
                if (isSelected) toggleModule(module.id);
                else if (hasSettings) setActiveModule(module);
                else toggleModule(module.id);
              }} className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col h-full ${isSelected ? 'border-blue-600 bg-blue-50/30 shadow-lg shadow-blue-100 scale-[1.02]' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'}`}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{module.title}</h3>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {isSelected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                </div>
                <p className="text-gray-600 mb-6 flex-grow">{module.description}</p>
                <div className="mt-auto pt-4 border-t border-gray-100/80 flex items-center justify-between">
                  <span className="text-2xl font-black text-gray-900">${module.price}</span>
                  <div className="flex items-center gap-2">
                    {hasSettings && !isSelected && <Settings className="w-4 h-4 text-gray-400" />}
                    <span className={`text-sm font-bold ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                      {isSelected ? 'В сборке' : hasSettings ? 'Настроить' : 'Добавить'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {activeModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-white/60 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200/50 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <Settings className="w-5 h-5 text-blue-600" />
                Настройка: {activeModule.title}
              </h3>
              <button onClick={() => setActiveModule(null)} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {activeModule.settings?.map((setting: Setting) => {
                const currentValue = moduleSettings[activeModule.id]?.[setting.id] || '';
                const currentBool = moduleSettings[activeModule.id]?.[setting.id] || false;

                return (
                  <div key={setting.id} className="flex flex-col gap-2.5">
                    <label className="font-bold text-gray-800 text-sm tracking-wide">{setting.name}</label>
                    
                    {setting.type === 'select' && (
                      <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner w-full">
                        {setting.options?.map((opt: string) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => updateSetting(activeModule.id, setting.id, opt)}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${
                              currentValue === opt
                                ? 'bg-white text-blue-600 shadow-sm scale-100'
                                : 'text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {setting.type === 'string' && (
                      <input 
                        type="text"
                        placeholder={`Введите ${setting.name.toLowerCase()}...`}
                        className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                        value={currentValue}
                        onChange={(e) => updateSetting(activeModule.id, setting.id, e.target.value)}
                      />
                    )}

                    {setting.type === 'boolean' && (
                      <label className="relative inline-flex items-center cursor-pointer mt-1">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={currentBool}
                          onChange={(e) => updateSetting(activeModule.id, setting.id, e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-100 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-700">Включить</span>
                      </label>
                    )}
                  </div>
                )
              })}
            </div>
            
            <div className="px-6 py-5 border-t border-gray-200/50 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setActiveModule(null)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">
                Отмена
              </button>
              <button onClick={handleConfirmSettings} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition-all">
                Сохранить и Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-white/60 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-gray-200/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {authStep === 'cart' && 'Ваша сборка'}
                {authStep === 'register' && 'Создать аккаунт'}
                {authStep === 'login' && 'Вход в аккаунт'}
                {authStep === 'verify_wait' && 'Код подтверждения'}
                {authStep === 'questionnaire' && 'Анкета проекта'}
              </h3>
              <button onClick={() => setCheckoutOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {authStep === 'cart' && (
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  {AVAILABLE_MODULES.filter(m => cart.includes(m.id)).map(m => (
                    <div key={m.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <span className="font-bold text-gray-900">{m.title}</span>
                      <span className="font-black text-blue-600">${m.price}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-200/50 flex justify-between items-center mb-6">
                  <span className="text-lg text-gray-600 font-bold">Итого к оплате:</span>
                  <span className="text-3xl font-black text-blue-600">${totalPrice}</span>
                </div>
                <button onClick={handleContinueFromCart} className="w-full flex justify-center items-center gap-2 px-6 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all">
                  Продолжить <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {authStep === 'register' && (
              <div className="p-6 space-y-4">
                <p className="text-gray-500 text-sm font-medium mb-2">Создайте аккаунт, чтобы сохранить сборку и получить ZIP-архив.</p>
                <div className="relative">
                  <UserIcon className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                  <input type="text" placeholder="Ваше Имя" value={name} onChange={e => setName(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                  <input type="email" placeholder="Рабочая Почта" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                  <input type="password" placeholder="Придумайте Пароль" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <button onClick={handleRegister} disabled={authLoading} className="w-full mt-2 flex justify-center items-center gap-2 px-6 py-4 rounded-xl font-bold text-white bg-gray-900 hover:bg-black shadow-md transition-all">
                  {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Зарегистрироваться'}
                </button>
                <p className="text-center text-sm text-gray-500 font-medium mt-4">
                  Уже есть аккаунт? <button onClick={() => setAuthStep('login')} className="text-blue-600 hover:underline">Войти</button>
                </p>
              </div>
            )}

            {authStep === 'login' && (
              <div className="p-6 space-y-4">
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                  <input type="email" placeholder="Почта" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                  <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <button onClick={handleLogin} disabled={authLoading} className="w-full flex justify-center items-center gap-2 px-6 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all">
                  {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Войти и Скачать'}
                </button>
                <p className="text-center text-sm text-gray-500 font-medium mt-4">
                  Нет аккаунта? <button onClick={() => setAuthStep('register')} className="text-blue-600 hover:underline">Создать</button>
                </p>
              </div>
            )}

            {/* НОВЫЙ ЭКРАН: ВВОД 6-ЗНАЧНОГО КОДА */}
            {authStep === 'verify_wait' && (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-black text-gray-900">Проверьте почту</h4>
                <p className="text-gray-500 font-medium leading-relaxed mb-4">
                  Мы отправили 6-значный код на <b>{email}</b>. 
                  Введите его ниже для входа.
                </p>
                
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="000000" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} 
                  className="w-full text-center text-3xl tracking-[0.5em] font-black py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all" 
                />

                <button 
                  onClick={handleVerifyOTP} 
                  disabled={authLoading || otp.length !== 6} 
                  className="w-full mt-4 flex justify-center items-center px-6 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-200"
                >
                  {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Подтвердить код'}
                </button>
              </div>
            )}

            {authStep === 'questionnaire' && (
              <div className="p-6 space-y-5">
                <p className="text-gray-600 font-medium text-sm">Последний шаг перед загрузкой архива. Это поможет нам сделать продукт лучше.</p>
                
                <div className="space-y-2">
                  <label className="font-bold text-sm text-gray-800">Какая у вас роль?</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    <option value="" disabled>Выберите из списка...</option>
                    <option value="dev">Разработчик</option>
                    <option value="owner">Владелец бизнеса</option>
                    <option value="manager">Менеджер проекта</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-sm text-gray-800">Для чего вам бот?</label>
                  <select value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    <option value="" disabled>Выберите цель...</option>
                    <option value="personal">Личный проект</option>
                    <option value="client">Делаю для клиента</option>
                    <option value="test">Просто тестирую идею</option>
                  </select>
                </div>

                <button onClick={handleCheckoutAndGenerate} disabled={isGenerating || !role || !purpose} className="w-full mt-4 flex justify-center items-center gap-2 px-6 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md disabled:opacity-50 transition-all">
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Download className="w-5 h-5" /> Скачать ZIP-архив</>}
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  )
}

export default App