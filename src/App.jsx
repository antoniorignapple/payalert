import { useState, useEffect, useCallback } from 'react';
import { getShortDeviceId } from './lib/device';
import { getPayments, createPayment, deletePayment, eurosToCents, centsToEuros } from './lib/api';
import { isPushSupported, getPermissionStatus, subscribeToNotifications, isSubscribed } from './lib/push';

// ============ ICONS ============

function BellIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function BellOffIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11M6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h9M13.73 21a2 2 0 01-3.46 0M9.5 5.5A2 2 0 0112 4a2 2 0 012 1.341M3 3l18 18" />
    </svg>
  );
}

function TrashIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function RefreshIcon({ className = "w-5 h-5", spinning = false }) {
  return (
    <svg className={`${className} ${spinning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function PlusIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function CheckIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CreditCardIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  );
}

// ============ TOAST COMPONENT ============

function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-emerald-500/90',
    error: 'bg-red-500/90',
    info: 'bg-blue-500/90',
    warning: 'bg-amber-500/90',
  }[type];

  return (
    <div className={`toast-enter fixed top-4 left-4 right-4 mx-auto max-w-md ${bgColor} text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between z-50`}>
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-3 hover:opacity-70 transition-opacity">
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============ BADGE COMPONENT ============

function StatusBadge({ daysUntil }) {
  let text, bgColor, textColor;

  if (daysUntil < 0) {
    text = 'Scaduto';
    bgColor = 'bg-red-500/20';
    textColor = 'text-red-400';
  } else if (daysUntil === 0) {
    text = 'Oggi';
    bgColor = 'bg-orange-500/20';
    textColor = 'text-orange-400';
  } else if (daysUntil <= 3) {
    text = `${daysUntil}g`;
    bgColor = 'bg-amber-500/20';
    textColor = 'text-amber-400';
  } else if (daysUntil <= 7) {
    text = `${daysUntil}g`;
    bgColor = 'bg-yellow-500/20';
    textColor = 'text-yellow-400';
  } else {
    text = `${daysUntil}g`;
    bgColor = 'bg-slate-500/20';
    textColor = 'text-slate-400';
  }

  return (
    <span className={`${bgColor} ${textColor} text-xs font-semibold px-2 py-1 rounded-md`}>
      {text}
    </span>
  );
}

// ============ PAYMENT ITEM ============

function PaymentItem({ payment, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const dueDate = new Date(payment.due_date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = dueDate - today;
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const formattedDate = dueDate.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(payment.id);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className={`glass rounded-xl p-4 animate-fade-in transition-all duration-300 ${daysUntil < 0 ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge daysUntil={daysUntil} />
            <span className="text-slate-400 text-xs">{formattedDate}</span>
          </div>
          <h3 className="font-semibold text-white truncate">{payment.title}</h3>
          {payment.amount_cents && (
            <p className="text-orange-400 font-medium mt-1">{centsToEuros(payment.amount_cents)}</p>
          )}
          {payment.notes && (
            <p className="text-slate-400 text-sm mt-1 line-clamp-2">{payment.notes}</p>
          )}
        </div>
        
        <div className="flex-shrink-0">
          {showConfirm ? (
            <div className="flex gap-1">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="p-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 rounded-lg transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="p-2 hover:bg-white/5 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ ADD PAYMENT FORM ============

function AddPaymentForm({ onAdd, isLoading }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDueDate(today);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        title: title.trim(),
        due_date: dueDate,
        amount_cents: eurosToCents(amount),
        notes: notes.trim() || null,
      });
      // Reset form
      setTitle('');
      setAmount('');
      setNotes('');
      // Keep date
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-5">
      <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
        <PlusIcon className="w-5 h-5 text-orange-400" />
        Aggiungi pagamento
      </h2>
      
      <div className="space-y-3">
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titolo pagamento *"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
          <div className="w-28">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="€ Importo"
              inputMode="decimal"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !dueDate}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 glow-sm-orange disabled:shadow-none flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <RefreshIcon className="w-5 h-5" spinning />
              Salvataggio...
            </>
          ) : (
            <>
              <PlusIcon className="w-5 h-5" />
              Salva
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ============ NOTIFICATION BUTTON ============

function NotificationButton() {
  const [status, setStatus] = useState('loading');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
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
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const result = await subscribeToNotifications();
      if (result.success) {
        setStatus('subscribed');
      } else {
        if (result.message.includes('negato')) {
          setStatus('denied');
        }
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  if (status === 'loading') {
    return null;
  }

  if (status === 'unsupported') {
    return (
      <div className="text-xs text-slate-500 flex items-center gap-1">
        <BellOffIcon className="w-4 h-4" />
        Non supportato
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="text-xs text-red-400 flex items-center gap-1">
        <BellOffIcon className="w-4 h-4" />
        Bloccate
      </div>
    );
  }

  if (status === 'subscribed') {
    return (
      <div className="text-xs text-emerald-400 flex items-center gap-1">
        <BellIcon className="w-4 h-4" />
        Attive
      </div>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={isSubscribing}
      className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors disabled:opacity-50"
    >
      {isSubscribing ? (
        <RefreshIcon className="w-4 h-4" spinning />
      ) : (
        <BellIcon className="w-4 h-4" />
      )}
      Attiva notifiche
    </button>
  );
}

// ============ MAIN APP ============

export default function App() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const deviceId = getShortDeviceId();

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const loadPayments = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    setError(null);

    try {
      const data = await getPayments();
      setPayments(data);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleAddPayment = async (paymentData) => {
    try {
      await createPayment(paymentData);
      showToast('Pagamento aggiunto!', 'success');
      await loadPayments();
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleDeletePayment = async (paymentId) => {
    try {
      await deletePayment(paymentId);
      showToast('Pagamento eliminato', 'info');
      await loadPayments();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center glow-sm-orange">
                <CreditCardIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-white">PayAlert</h1>
                <p className="text-xs text-slate-500 font-mono">ID: {deviceId}</p>
              </div>
            </div>
            <NotificationButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6 safe-bottom">
        {/* Add Payment Form */}
        <AddPaymentForm onAdd={handleAddPayment} isLoading={isLoading} />

        {/* Payments List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <span className="text-slate-300">Pagamenti</span>
              {payments.length > 0 && (
                <span className="bg-white/10 text-slate-400 text-xs px-2 py-0.5 rounded-md">
                  {payments.length}
                </span>
              )}
            </h2>
            <button
              onClick={() => loadPayments(true)}
              disabled={isRefreshing}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white disabled:opacity-50"
            >
              <RefreshIcon className="w-5 h-5" spinning={isRefreshing} />
            </button>
          </div>

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-4">
              <p className="font-medium">Errore di caricamento</p>
              <p className="text-red-400/70 mt-1">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="glass rounded-xl p-8 flex flex-col items-center justify-center">
              <RefreshIcon className="w-8 h-8 text-orange-400 mb-3" spinning />
              <p className="text-slate-400 text-sm">Caricamento...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && payments.length === 0 && (
            <div className="glass rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCardIcon className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400 mb-2">Nessun pagamento</p>
              <p className="text-slate-500 text-sm">Aggiungi il tuo primo pagamento</p>
            </div>
          )}

          {/* Payments List */}
          {!isLoading && payments.length > 0 && (
            <div className="space-y-3">
              {payments.map((payment) => (
                <PaymentItem
                  key={payment.id}
                  payment={payment}
                  onDelete={handleDeletePayment}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-600">
        PayAlert © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
