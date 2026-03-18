import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
  eurosToCents,
  centsToEuros,
} from './lib/api';
import {
  isPushSupported,
  getPermissionStatus,
  subscribeToNotifications,
  isSubscribed,
} from './lib/push';

// ==================== ICONS ====================

function BellIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function BellOffIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11M6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h9M13.73 21a2 2 0 01-3.46 0M9.5 5.5A2 2 0 0112 4a2 2 0 012 1.341M3 3l18 18"
      />
    </svg>
  );
}

function TrashIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function EditIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function RefreshIcon({ className = 'w-5 h-5', spinning = false }) {
  return (
    <svg
      className={`${className} ${spinning ? 'animate-spin' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function PlusIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function CheckIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CreditCardIcon({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
      />
    </svg>
  );
}

function ChevronDownIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function SparklesIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18l-.813-2.096a2 2 0 00-1.09-1.09L5 14l2.096-.813a2 2 0 001.09-1.09L9 10l.813 2.096a2 2 0 001.09 1.09L13 14l-2.096.813a2 2 0 00-1.09 1.09ZM18 8l.5 1.5L20 10l-1.5.5L18 12l-.5-1.5L16 10l1.5-.5L18 8ZM17 16l.75 2.25L20 19l-2.25.75L17 22l-.75-2.25L14 19l2.25-.75L17 16Z"
      />
    </svg>
  );
}

function BankIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 4l9 6.5M4.5 10.5h15M6 10.5V18m4-7.5V18m4-7.5V18m4-7.5V18M4 20h16" />
    </svg>
  );
}

function CashIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.5A2.25 2.25 0 0 1 4.5 5.25h15A2.25 2.25 0 0 1 21.75 7.5v9A2.25 2.25 0 0 1 19.5 18.75h-15A2.25 2.25 0 0 1 2.25 16.5v-9Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h.008v.008H6V12Zm12 0h.008v.008H18V12ZM12 15.75c1.657 0 3-1.679 3-3.75s-1.343-3.75-3-3.75-3 1.679-3 3.75 1.343 3.75 3 3.75Z" />
    </svg>
  );
}

// ==================== HELPERS ====================

const monthNames = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

function parseLocalDate(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

function getMonthKey(dateString) {
  const date = parseLocalDate(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function sortPaymentsByDate(items) {
  return [...items].sort((a, b) => {
    const da = parseLocalDate(a.due_date);
    const db = parseLocalDate(b.due_date);
    if (da - db !== 0) return da - db;
    return String(a.title || '').localeCompare(String(b.title || ''), 'it');
  });
}

function formatSignedCurrency(cents) {
  const abs = Math.abs(cents);
  const formatted = centsToEuros(abs);
  return cents >= 0 ? `+ ${formatted}` : `- ${formatted}`;
}

function safeLoadNumber(key, defaultValue = 0) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveNumber(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

// ==================== UI BASE ====================

function Surface({ className = '', children }) {
  return (
    <div className={`rounded-2xl border border-white/70 bg-white/80 backdrop-blur shadow-[0_10px_30px_rgba(15,23,42,0.08)] ${className}`}>
      {children}
    </div>
  );
}

// ==================== TOAST ====================

function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3800);
    return () => clearTimeout(timer);
  }, [onClose]);

  const tone = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-slate-900',
    warning: 'bg-amber-500 text-slate-900',
  }[type] || 'bg-slate-900';

  return (
    <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md">
      <div className={`${tone} text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3`}>
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="opacity-80 hover:opacity-100 transition-opacity">
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ==================== NOTIFICATION BUTTON ====================

function NotificationButton() {
  const [status, setStatus] = useState('loading');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!isPushSupported()) {
      setStatus('unsupported');
      return;
    }

    const permission = getPermissionStatus();
    if (permission === 'denied') {
      setStatus('denied');
      return;
    }

    const subscribed = await isSubscribed();
    setStatus(subscribed ? 'subscribed' : 'unsubscribed');
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const result = await subscribeToNotifications();
      if (result.success) {
        setStatus('subscribed');
      } else if (result.message?.toLowerCase().includes('negato')) {
        setStatus('denied');
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  if (status === 'loading') return null;

  if (status === 'unsupported') {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
        <BellOffIcon className="w-4 h-4" />
        Non supportato
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
        <BellOffIcon className="w-4 h-4" />
        Bloccate
      </div>
    );
  }

  if (status === 'subscribed') {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
        <BellIcon className="w-4 h-4" />
        Attive
      </div>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={isSubscribing}
      className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition disabled:opacity-50"
    >
      {isSubscribing ? <RefreshIcon className="w-4 h-4" spinning /> : <BellIcon className="w-4 h-4" />}
      Attiva notifiche
    </button>
  );
}

// ==================== SALVADANAI ====================

function WalletCard({ label, icon, value, onChange, colorClasses }) {
  const [draft, setDraft] = useState(value ? (value / 100).toString().replace('.', ',') : '');

  useEffect(() => {
    setDraft(value ? (value / 100).toString().replace('.', ',') : '');
  }, [value]);

  const handleSave = () => {
    onChange(eurosToCents(draft));
  };

  return (
    <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${colorClasses}`}>
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-bold mb-1">
            {label}
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              pattern="[0-9]+([,\.][0-9]{1,2})?"
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 font-bold outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />

            <button
              type="button"
              onClick={handleSave}
              className="rounded-2xl px-4 py-2.5 font-semibold text-white bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500 hover:opacity-95 transition shadow-lg shadow-sky-200 whitespace-nowrap"
            >
              Salva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SavingsSection({ cashCents, bankCents, onChangeCash, onChangeBank }) {
  return (
    <Surface className="p-4 md:p-5 overflow-hidden relative">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-emerald-100/60 via-sky-100/50 to-cyan-100/60" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-sky-600 font-bold">Salvadanaio</p>
            <h2 className="text-lg font-black text-slate-900">Disponibilità accantonata</h2>
          </div>
        </div>

        <div className="space-y-3">
          <WalletCard
            label="Contante"
            value={cashCents}
            onChange={onChangeCash}
            icon={<CashIcon className="w-5 h-5" />}
            colorClasses="bg-emerald-50 text-emerald-700 border border-emerald-100"
          />

          <WalletCard
            label="Conto corrente"
            value={bankCents}
            onChange={onChangeBank}
            icon={<BankIcon className="w-5 h-5" />}
            colorClasses="bg-sky-50 text-sky-700 border border-sky-100"
          />
        </div>
      </div>
    </Surface>
  );
}

// ==================== ADD PAYMENT FORM ====================

function AddPaymentForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [isBankCharge, setIsBankCharge] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleRef = useRef(null);

  useEffect(() => {
    setDueDate(new Date().toISOString().split('T')[0]);
  }, []);

  const inputBase =
    'w-full rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        title: title.trim(),
        due_date: dueDate,
        amount_cents: eurosToCents(amount),
        notes: null,
        is_bank_charge: isBankCharge,
      });

      setTitle('');
      setAmount('');
      setIsBankCharge(false);
      titleRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Surface className="p-4 md:p-5 overflow-hidden relative">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-sky-100/70 via-cyan-100/50 to-indigo-100/70 pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-sky-200">
            <PlusIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-sky-600 font-bold">Nuovo pagamento</p>
            <h2 className="text-lg font-black text-slate-900">Aggiungi una scadenza</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1.25fr_0.75fr] gap-3">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Descrizione"
              required
              className={inputBase}
            />

            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Importo €"
              inputMode="decimal"
              pattern="[0-9]+([,\.][0-9]{1,2})?"
              className={inputBase}
            />

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className={inputBase}
            />

            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !dueDate}
              className="rounded-2xl px-4 py-3 font-bold text-white bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500 hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-lg shadow-sky-200"
            >
              {isSubmitting ? <RefreshIcon className="w-5 h-5" spinning /> : <CheckIcon className="w-5 h-5" />}
              Salva
            </button>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 cursor-pointer hover:bg-slate-50 transition">
     <input
  type="checkbox"
  checked={isBankCharge}
  onChange={(e) => setIsBankCharge(e.target.checked)}
  className="h-5 w-5 shrink-0 cursor-pointer accent-sky-600"
/>
            <div className="flex items-center gap-2">
              <BankIcon className="w-5 h-5 text-sky-600" />
              <span className="font-semibold text-slate-800">Addebito diretto su c/c</span>
            </div>
          </label>
        </form>
      </div>
    </Surface>
  );
}

// ==================== EDIT MODAL ====================

function EditModal({ payment, onSave, onClose }) {
  const [title, setTitle] = useState(payment.title);
  const [dueDate, setDueDate] = useState(payment.due_date);
  const [amount, setAmount] = useState(payment.amount_cents ? (payment.amount_cents / 100).toString().replace('.', ',') : '');
  const [isBankCharge, setIsBankCharge] = useState(Boolean(payment.is_bank_charge));
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState('');

  const inputBase =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || isSaving) return;

    setIsSaving(true);
    setLocalError('');

    try {
      await onSave({
        id: payment.id,
        title: title.trim(),
        due_date: dueDate,
        amount_cents: eurosToCents(amount),
        is_bank_charge: isBankCharge,
      });
      onClose();
    } catch (err) {
      setLocalError(err?.message || 'Errore durante il salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-white/80 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sky-500 font-bold">Modifica</p>
            <h2 className="text-xl font-black text-slate-900 mt-1">Aggiorna pagamento</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Descrizione"
            required
            className={inputBase}
          />

          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Importo €"
            inputMode="decimal"
            pattern="[0-9]+([,\.][0-9]{1,2})?"
            className={inputBase}
          />

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className={inputBase}
          />

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 cursor-pointer hover:bg-slate-50 transition">
            <input
              type="checkbox"
              checked={isBankCharge}
              onChange={(e) => setIsBankCharge(e.target.checked)}
              className="w-5 h-5 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <div className="flex items-center gap-2">
              <BankIcon className="w-5 h-5 text-sky-600" />
              <span className="font-semibold text-slate-800">Addebito diretto su c/c</span>
            </div>
          </label>

          {localError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
              {localError}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Annulla
            </button>

            <button
              type="submit"
              disabled={isSaving || !title.trim() || !dueDate}
              className="rounded-2xl px-4 py-3 font-semibold text-white bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500 hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-lg shadow-sky-200"
            >
              {isSaving ? <RefreshIcon className="w-5 h-5" spinning /> : <CheckIcon className="w-5 h-5" />}
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== PAYMENT ITEM ====================

function PaymentItem({ payment, onDelete, onUpdate }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const dueDate = parseLocalDate(payment.due_date);
  const formattedDate = dueDate.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(payment.id);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                {formattedDate}
              </span>

              {payment.is_bank_charge ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                  <BankIcon className="w-3.5 h-3.5" />
                  c/c
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CashIcon className="w-3.5 h-3.5" />
                  manuale
                </span>
              )}
            </div>

            <h3 className="text-[15px] font-bold truncate text-slate-900">{payment.title}</h3>

            {payment.amount_cents ? (
              <p className="mt-1 text-sm font-extrabold text-orange-600">
                {centsToEuros(payment.amount_cents)}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-400">Importo non inserito</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {!showConfirm ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowEdit(true)}
                  className="p-2 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition"
                  title="Modifica"
                >
                  <EditIcon className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowConfirm(true)}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                  title="Elimina"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-red-200 bg-white p-2">
                <p className="text-[11px] font-semibold text-red-700 mb-2 px-1">Eliminare?</p>
                <div className="flex gap-1">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEdit ? (
        <EditModal payment={payment} onSave={onUpdate} onClose={() => setShowEdit(false)} />
      ) : null}
    </>
  );
}

// ==================== MONTH INCOME CARD ====================

function MonthIncomeEditor({ monthKey, valueCents, onSave }) {
  const [draft, setDraft] = useState(valueCents ? (valueCents / 100).toString().replace('.', ',') : '');

  useEffect(() => {
    setDraft(valueCents ? (valueCents / 100).toString().replace('.', ',') : '');
  }, [valueCents]);

  const handleBlur = () => {
    onSave(monthKey, eurosToCents(draft));
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-700 font-bold">Entrate mese</p>
          <p className="text-sm text-emerald-700/80">Inserisci o modifica quando vuoi</p>
        </div>
        <span className="text-sm font-bold text-emerald-700">{centsToEuros(valueCents || 0)}</span>
      </div>

      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        placeholder="0,00"
        inputMode="decimal"
        pattern="[0-9]+([,\.][0-9]{1,2})?"
        className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 font-bold outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
}

// ==================== MONTH GROUP ====================

function MonthGroup({
  monthKey,
  payments,
  incomeCents,
  onSaveIncome,
  onDelete,
  onUpdate,
}) {
  const [year, month] = monthKey.split('-');
  const monthName = monthNames[parseInt(month, 10) - 1];
  const [isExpanded, setIsExpanded] = useState(false);

  const totalOut = payments.reduce((sum, p) => sum + (p.amount_cents || 0), 0);
  const totalBank = payments
    .filter((p) => p.is_bank_charge)
    .reduce((sum, p) => sum + (p.amount_cents || 0), 0);
  const diff = (incomeCents || 0) - totalOut;
  const isCurrentMonth = monthKey === getCurrentMonthKey();

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full text-left rounded-3xl border border-white/80 bg-white/80 backdrop-blur p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] hover:bg-white transition"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-100 to-cyan-100 text-sky-700 flex items-center justify-center shrink-0">
              <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
            </div>

            <div className="min-w-0">
              <h3 className="text-[1.05rem] font-black text-slate-900 tracking-tight">
                {monthName} {year}
              </h3>

              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Entrate: {centsToEuros(incomeCents || 0)}
                </span>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  Uscite: {centsToEuros(totalOut)}
                </span>

                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    diff >= 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  Differenza: {formatSignedCurrency(diff)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <span className="text-slate-500">{payments.length} pagament{payments.length === 1 ? 'o' : 'i'}</span>
                <span className="text-sky-700 font-semibold flex items-center gap-1">
                  <BankIcon className="w-3.5 h-3.5" />
                  Da lasciare su c/c: {centsToEuros(totalBank)}
                </span>
                {isCurrentMonth ? (
                  <span className="text-slate-500">Mese corrente</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </button>

      {isExpanded ? (
        <div className="mt-3 pl-1 space-y-3">
          <MonthIncomeEditor monthKey={monthKey} valueCents={incomeCents || 0} onSave={onSaveIncome} />

          <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 flex flex-wrap gap-x-5 gap-y-2 text-sm shadow-sm">
            <span className="text-emerald-700 font-semibold">
              Entrate: <strong>{centsToEuros(incomeCents || 0)}</strong>
            </span>

            <span className="text-orange-700 font-semibold">
              Uscite: <strong>{centsToEuros(totalOut)}</strong>
            </span>

            <span className="text-sky-700 font-semibold">
              Su c/c: <strong>{centsToEuros(totalBank)}</strong>
            </span>

            <span className={`font-semibold ${diff >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              Differenza: <strong>{formatSignedCurrency(diff)}</strong>
            </span>
          </div>

          {payments.map((payment) => (
            <PaymentItem
              key={payment.id}
              payment={payment}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ==================== MAIN APP ====================

export default function App() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [cashSavingsCents, setCashSavingsCents] = useState(() => safeLoadNumber('payalert_savings_cash', 0));
  const [bankSavingsCents, setBankSavingsCents] = useState(() => safeLoadNumber('payalert_savings_bank', 0));
  const [monthIncomes, setMonthIncomes] = useState(() => {
    try {
      const raw = localStorage.getItem('payalert_month_incomes');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    saveNumber('payalert_savings_cash', cashSavingsCents || 0);
  }, [cashSavingsCents]);

  useEffect(() => {
    saveNumber('payalert_savings_bank', bankSavingsCents || 0);
  }, [bankSavingsCents]);

  useEffect(() => {
    try {
      localStorage.setItem('payalert_month_incomes', JSON.stringify(monthIncomes));
    } catch {
      // ignore
    }
  }, [monthIncomes]);

  const loadPayments = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);
      setError(null);

      try {
        const data = await getPayments();
        setPayments(sortPaymentsByDate(data));
      } catch (err) {
        const message = err?.message || 'Errore di caricamento';
        setError(message);
        showToast(message, 'error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const groupedPayments = useMemo(() => {
    const groups = {};

    payments.forEach((payment) => {
      const monthKey = getMonthKey(payment.due_date);
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(payment);
    });

    Object.keys(groups).forEach((key) => {
      groups[key] = sortPaymentsByDate(groups[key]);
    });

    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    );
  }, [payments]);

  const handleSaveMonthIncome = useCallback((monthKey, incomeCents) => {
    setMonthIncomes((prev) => ({
      ...prev,
      [monthKey]: incomeCents || 0,
    }));
    showToast('Entrata mese aggiornata', 'success');
  }, [showToast]);

  const handleAddPayment = async (paymentData) => {
    try {
      await createPayment(paymentData);
      showToast('Pagamento aggiunto!', 'success');
      await loadPayments();
    } catch (err) {
      const message = err?.message || 'Errore durante il salvataggio';
      showToast(message, 'error');
      throw err;
    }
  };

  const handleUpdatePayment = async (paymentData) => {
    try {
      await updatePayment(paymentData);
      showToast('Pagamento aggiornato!', 'success');
      await loadPayments();
    } catch (err) {
      const message = err?.message || 'Errore durante l’aggiornamento';
      showToast(message, 'error');
      throw err;
    }
  };

  const handleDeletePayment = async (paymentId) => {
    try {
      await deletePayment(paymentId);
      showToast('Pagamento eliminato', 'info');
      await loadPayments();
    } catch (err) {
      const message = err?.message || 'Errore durante l’eliminazione';
      showToast(message, 'error');
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[linear-gradient(180deg,#f7fbff_0%,#eef7ff_42%,#f8fafc_100%)] text-slate-900">
      {toast ? (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      ) : null}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute top-40 -right-16 w-72 h-72 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[28rem] h-[14rem] rounded-full bg-indigo-200/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/65 border-b border-white/60">
        <div className="max-w-2xl mx-auto px-4 pt-[max(0.85rem,env(safe-area-inset-top))] pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-white/80 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src="/icon-192.png"
                  alt="PayAlert"
                  className="w-10 h-10 object-contain"
                  draggable="false"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-[1.3rem] font-black tracking-tight text-slate-900 truncate">
                    PayAlert
                  </h1>
                  <SparklesIcon className="w-4 h-4 text-sky-500" />
                </div>
                <p className="text-sm text-slate-500 truncate">
                  Entrate, uscite e conto corrente tutto sotto controllo
                </p>
              </div>
            </div>

            <NotificationButton />
          </div>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-4 py-5 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <SavingsSection
          cashCents={cashSavingsCents}
          bankCents={bankSavingsCents}
          onChangeCash={setCashSavingsCents}
          onChangeBank={setBankSavingsCents}
        />

        <AddPaymentForm onAdd={handleAddPayment} />

        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Mesi</h2>
              <p className="text-sm text-slate-500">Ogni mese parte chiuso, lo apri solo tu</p>
            </div>

            <button
              onClick={() => loadPayments(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              title="Aggiorna"
            >
              <RefreshIcon className="w-4 h-4" spinning={isRefreshing} />
              Aggiorna
            </button>
          </div>

          {error && !isLoading ? (
            <Surface className="p-4 border-red-200 bg-red-50/90">
              <p className="font-bold text-red-700">Errore di caricamento</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </Surface>
          ) : null}

          {isLoading ? (
            <Surface className="p-10 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-4">
                <RefreshIcon className="w-7 h-7 text-sky-600" spinning />
              </div>
              <p className="text-slate-700 font-semibold">Caricamento in corso...</p>
              <p className="text-sm text-slate-500 mt-1">Sto preparando i tuoi pagamenti</p>
            </Surface>
          ) : null}

          {!isLoading && !error && payments.length === 0 ? (
            <Surface className="p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-sky-50 to-cyan-50 border border-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-4">
                <CreditCardIcon className="w-8 h-8" />
              </div>

              <p className="text-lg font-black text-slate-900">Nessun pagamento</p>
              <p className="text-sm text-slate-500 mt-1">
                Aggiungi il tuo primo pagamento e inizia con stile.
              </p>
            </Surface>
          ) : null}

          {!isLoading && Object.keys(groupedPayments).length > 0 ? (
            <div>
              {Object.entries(groupedPayments).map(([monthKey, monthPayments]) => (
                <MonthGroup
                  key={monthKey}
                  monthKey={monthKey}
                  payments={monthPayments}
                  incomeCents={monthIncomes[monthKey] || 0}
                  onSaveIncome={handleSaveMonthIncome}
                  onDelete={handleDeletePayment}
                  onUpdate={handleUpdatePayment}
                />
              ))}
            </div>
          ) : null}
        </section>
      </main>

      <footer className="text-center py-5 text-xs text-slate-400">
        PayAlert © {new Date().getFullYear()}
      </footer>
    </div>
  );
}