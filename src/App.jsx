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
        d="M19 7l-.867 12.142A2.002 2.002 0 0116.138 21H7.862a2.002 2.002 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M4.582 9H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
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
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7.5h18M3 9.75h18M5.25 15h5.25m-5.25 2.25H9m10.5 2.25H4.5A2.25 2.25 0 012.25 17.25v-10.5A2.25 2.25 0 014.5 4.5h15A2.25 2.25 0 0121.75 6.75v10.5A2.25 2.25 0 0119.5 19.5Z"
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

function CalendarIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 2v3M16 2v3M3.75 9.25h16.5M5.25 4.75h13.5A1.5 1.5 0 0120.25 6.25v12.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V6.25a1.5 1.5 0 011.5-1.5Z"
      />
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

function sortPaymentsByDate(items) {
  return [...items].sort((a, b) => {
    const da = parseLocalDate(a.due_date);
    const db = parseLocalDate(b.due_date);
    if (da - db !== 0) return da - db;
    return String(a.title || '').localeCompare(String(b.title || ''), 'it');
  });
}

function isPastDate(dateString) {
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return parseLocalDate(dateString) < todayOnly;
}

// ==================== UI BASE ====================

function Surface({ className = '', children }) {
  return (
    <div
      className={`rounded-[28px] border border-white/70 bg-white/70 backdrop-blur-xl shadow-[0_16px_50px_rgba(15,23,42,0.10)] ${className}`}
    >
      {children}
    </div>
  );
}

// ==================== TOAST ====================

function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const tone = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
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
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-500">
        <BellOffIcon className="w-4 h-4" />
        Non supportato
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
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
      className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-white/90 px-3 py-2 text-xs font-semibold text-fuchsia-700 hover:bg-fuchsia-50 transition disabled:opacity-50"
    >
      {isSubscribing ? <RefreshIcon className="w-4 h-4" spinning /> : <BellIcon className="w-4 h-4" />}
      Attiva notifiche
    </button>
  );
}

// ==================== ADD PAYMENT FORM ====================

function AddPaymentForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleRef = useRef(null);

  useEffect(() => {
    setDueDate(new Date().toISOString().split('T')[0]);
  }, []);

  const inputBase =
    'w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-fuchsia-300 focus:ring-4 focus:ring-fuchsia-100';

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
      });

      setTitle('');
      setAmount('');
      titleRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Surface className="p-4 md:p-5 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.15),transparent_35%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.72))]" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-sky-500 text-white flex items-center justify-center shadow-lg shadow-fuchsia-200">
            <PlusIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-fuchsia-600 font-bold">Nuovo pagamento</p>
            <h2 className="text-lg font-black text-slate-900">Aggiungi una scadenza</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_0.8fr] gap-3">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Descrizione pagamento"
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
              className="rounded-2xl px-4 py-3 font-bold text-white bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-200"
            >
              {isSubmitting ? <RefreshIcon className="w-5 h-5" spinning /> : <CheckIcon className="w-5 h-5" />}
              Salva
            </button>
          </div>
        </form>
      </div>
    </Surface>
  );
}

// ==================== EDIT MODAL ====================

function EditModal({ payment, onSave, onClose }) {
  const [title, setTitle] = useState(payment.title);
  const [dueDate, setDueDate] = useState(payment.due_date);
  const [amount, setAmount] = useState(
    payment.amount_cents ? (payment.amount_cents / 100).toString().replace('.', ',') : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState('');

  const inputBase =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-fuchsia-300 focus:ring-4 focus:ring-fuchsia-100';

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
      });
      onClose();
    } catch (err) {
      setLocalError(err?.message || 'Errore durante il salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[30px] bg-white shadow-2xl border border-white/80 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-500 font-bold">Modifica</p>
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

          {localError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-sm px-4 py-3">
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
              className="rounded-2xl px-4 py-3 font-semibold text-white bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-200"
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

  const expired = isPastDate(payment.due_date);

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
      <div className="rounded-[24px] border border-white/70 bg-white/80 backdrop-blur p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                {formattedDate}
              </span>

              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  expired
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {expired ? 'Scaduto' : 'Da fare'}
              </span>
            </div>

            <h3 className="text-[15px] font-bold text-slate-900 break-words">{payment.title}</h3>

            {payment.amount_cents ? (
              <p className="mt-2 text-base font-extrabold bg-gradient-to-r from-fuchsia-600 to-sky-600 bg-clip-text text-transparent">
                {centsToEuros(payment.amount_cents)}
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Importo non inserito</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {!showConfirm ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowEdit(true)}
                  className="p-2 rounded-xl text-slate-500 hover:text-fuchsia-600 hover:bg-fuchsia-50 transition"
                  title="Modifica"
                >
                  <EditIcon className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowConfirm(true)}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Elimina"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-rose-200 bg-white p-2">
                <p className="text-[11px] font-semibold text-rose-700 mb-2 px-1">Eliminare?</p>
                <div className="flex gap-1">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition"
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

      {showEdit ? <EditModal payment={payment} onSave={onUpdate} onClose={() => setShowEdit(false)} /> : null}
    </>
  );
}

// ==================== MONTH GROUP ====================

function MonthGroup({ monthKey, payments, onDelete, onUpdate }) {
  const [year, month] = monthKey.split('-');
  const monthName = monthNames[parseInt(month, 10) - 1];
  const [isExpanded, setIsExpanded] = useState(false);

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount_cents || 0), 0);
  const paymentsCount = payments.length;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="group w-full text-left rounded-[30px] border border-white/70 bg-white/72 backdrop-blur-xl p-4 shadow-[0_16px_40px_rgba(15,23,42,0.09)] hover:bg-white/85 transition"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-100 via-violet-100 to-sky-100 text-fuchsia-700 flex items-center justify-center shrink-0">
              <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[1.05rem] font-black text-slate-900 tracking-tight">
                  {monthName} {year}
                </h3>

                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    isExpanded
                      ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isExpanded ? 'Aperto' : 'Chiuso'}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {paymentsCount} pagament{paymentsCount === 1 ? 'o' : 'i'}
                </span>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-fuchsia-50 to-sky-50 text-fuchsia-700 border border-fuchsia-100">
                  Totale da effettuare: {centsToEuros(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </button>

      {isExpanded ? (
        <div className="mt-3 pl-1 space-y-3">
          <div className="rounded-[24px] border border-fuchsia-100 bg-gradient-to-r from-fuchsia-50/90 via-violet-50/80 to-sky-50/90 px-4 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white text-fuchsia-600 flex items-center justify-center border border-fuchsia-100 shadow-sm">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-fuchsia-600 font-bold">Riepilogo mese</p>
                <p className="text-sm font-semibold text-slate-700">
                  Totale pagamenti da effettuare: <span className="font-black text-slate-900">{centsToEuros(totalAmount)}</span>
                </p>
              </div>
            </div>
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

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

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
    <div className="min-h-screen min-h-[100dvh] bg-[linear-gradient(180deg,#fdf7ff_0%,#f6f8ff_28%,#f4fbff_58%,#f8fafc_100%)] text-slate-900">
      {toast ? (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      ) : null}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-fuchsia-200/35 blur-3xl" />
        <div className="absolute top-16 -right-20 w-80 h-80 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[30rem] h-[14rem] rounded-full bg-violet-200/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/55 border-b border-white/60">
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
                  <SparklesIcon className="w-4 h-4 text-fuchsia-500" />
                </div>
                <p className="text-sm text-slate-500 truncate">
                  Pagamenti mensili, tutto ordinato e super pulito
                </p>
              </div>
            </div>

            <NotificationButton />
          </div>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-4 py-5 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <AddPaymentForm onAdd={handleAddPayment} />

        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Mesi</h2>
              <p className="text-sm text-slate-500">Apri il mese e gestisci i pagamenti dentro</p>
            </div>

            <button
              onClick={() => loadPayments(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white transition disabled:opacity-50"
              title="Aggiorna"
            >
              <RefreshIcon className="w-4 h-4" spinning={isRefreshing} />
              Aggiorna
            </button>
          </div>

          {error && !isLoading ? (
            <Surface className="p-4 border-rose-200 bg-rose-50/90">
              <p className="font-bold text-rose-700">Errore di caricamento</p>
              <p className="text-sm text-rose-600 mt-1">{error}</p>
            </Surface>
          ) : null}

          {isLoading ? (
            <Surface className="p-10 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-fuchsia-50 border border-fuchsia-100 flex items-center justify-center mb-4">
                <RefreshIcon className="w-7 h-7 text-fuchsia-600" spinning />
              </div>
              <p className="text-slate-700 font-semibold">Caricamento in corso...</p>
              <p className="text-sm text-slate-500 mt-1">Sto preparando i tuoi pagamenti</p>
            </Surface>
          ) : null}

          {!isLoading && !error && payments.length === 0 ? (
            <Surface className="p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-fuchsia-50 to-sky-50 border border-fuchsia-100 text-fuchsia-600 flex items-center justify-center mx-auto mb-4">
                <CreditCardIcon className="w-8 h-8" />
              </div>

              <p className="text-lg font-black text-slate-900">Nessun pagamento</p>
              <p className="text-sm text-slate-500 mt-1">
                Aggiungi il tuo primo pagamento per iniziare.
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