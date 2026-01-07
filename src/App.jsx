import { useState, useEffect, useCallback, useMemo } from 'react';
import { getShortDeviceId } from './lib/device';
import { getPayments, createPayment, updatePayment, deletePayment, eurosToCents, centsToEuros } from './lib/api';
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

function EditIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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

function ChevronDownIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CheckSquareIcon({ className = "w-5 h-5", checked = false }) {
  if (checked) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
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

function StatusBadge({ daysUntil, isPaid }) {
  let text, bgColor, textColor;

  if (isPaid) {
    text = 'Pagato';
    bgColor = 'bg-emerald-500/20';
    textColor = 'text-emerald-400';
  } else if (daysUntil < 0) {
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

// ============ EDIT MODAL ============

function EditModal({ payment, onSave, onClose }) {
  const [title, setTitle] = useState(payment.title);
  const [dueDate, setDueDate] = useState(payment.due_date);
  const [amount, setAmount] = useState(payment.amount_cents ? (payment.amount_cents / 100).toString().replace('.', ',') : '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        id: payment.id,
        title: title.trim(),
        due_date: dueDate,
        amount_cents: eurosToCents(amount),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const inputBase = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass rounded-2xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <EditIcon className="w-5 h-5 text-orange-400" />
            Modifica pagamento
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <XIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titolo pagamento" required className={inputBase} />
          <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="€ Importo" inputMode="decimal" className={inputBase} />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className={`${inputBase} appearance-none`} />

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-3 px-4 rounded-xl transition-all">Annulla</button>
            <button type="submit" disabled={isSaving || !title.trim() || !dueDate} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2">
              {isSaving ? <RefreshIcon className="w-5 h-5" spinning /> : <CheckIcon className="w-5 h-5" />}
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ PAYMENT ITEM ============

function PaymentItem({ payment, onDelete, onUpdate }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const dueDate = new Date(payment.due_date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = dueDate - today;
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const formattedDate = dueDate.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });

  const handleDelete = async () => {
    setIsDeleting(true);
    try { await onDelete(payment.id); } 
    finally { setIsDeleting(false); setShowConfirm(false); }
  };

  const handleTogglePaid = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try { await onUpdate({ id: payment.id, is_paid: !payment.is_paid }); } 
    finally { setIsToggling(false); }
  };

  return (
    <>
      <div className={`glass rounded-xl p-4 animate-fade-in transition-all duration-300 ${payment.is_paid ? 'border border-emerald-500/30' : ''} ${daysUntil < 0 && !payment.is_paid ? 'opacity-70' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge daysUntil={daysUntil} isPaid={payment.is_paid} />
              <span className="text-slate-400 text-xs">{formattedDate}</span>
            </div>
            <h3 className={`font-semibold truncate ${payment.is_paid ? 'text-emerald-400 line-through' : 'text-white'}`}>{payment.title}</h3>
            {payment.amount_cents ? <p className={`font-medium mt-1 ${payment.is_paid ? 'text-emerald-400/70' : 'text-orange-400'}`}>{centsToEuros(payment.amount_cents)}</p> : null}
          </div>

          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            {showConfirm ? (
              <div className="flex gap-1">
                <button onClick={handleDelete} disabled={isDeleting} className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"><CheckIcon className="w-4 h-4" /></button>
                <button onClick={() => setShowConfirm(false)} className="p-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 rounded-lg transition-colors"><XIcon className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex gap-1">
                <button onClick={() => setShowEdit(true)} className="p-2 hover:bg-white/5 text-slate-400 hover:text-blue-400 rounded-lg transition-colors"><EditIcon className="w-4 h-4" /></button>
                <button onClick={() => setShowConfirm(true)} className="p-2 hover:bg-white/5 text-slate-400 hover:text-red-400 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>
              </div>
            )}
            <button onClick={handleTogglePaid} disabled={isToggling} className={`p-2 rounded-lg transition-colors ${payment.is_paid ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-white/5 hover:text-emerald-400'}`} title={payment.is_paid ? 'Segna come non pagato' : 'Segna come pagato'}>
              <CheckSquareIcon className="w-5 h-5" checked={payment.is_paid} />
            </button>
          </div>
        </div>
      </div>
      {showEdit && <EditModal payment={payment} onSave={onUpdate} onClose={() => setShowEdit(false)} />}
    </>
  );
}

// ============ MONTH GROUP ============

function MonthGroup({ monthKey, payments, onDelete, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [year, month] = monthKey.split('-');
  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const monthName = monthNames[parseInt(month) - 1];

  const totalPaid = payments.filter(p => p.is_paid && p.amount_cents).reduce((sum, p) => sum + p.amount_cents, 0);
  const totalToPay = payments.filter(p => !p.is_paid && p.amount_cents).reduce((sum, p) => sum + p.amount_cents, 0);

  return (
    <div className="mb-4">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full glass rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
          <div className="text-left">
            <h3 className="font-display font-semibold text-white">{monthName} {year}</h3>
            <div className="flex gap-3 text-xs mt-1">
              {totalPaid > 0 && <span className="text-emerald-400">Pagato: {centsToEuros(totalPaid)}</span>}
              {totalToPay > 0 && <span className="text-orange-400">Da pagare: {centsToEuros(totalToPay)}</span>}
              {totalPaid === 0 && totalToPay === 0 && <span className="text-slate-500">{payments.length} pagament{payments.length === 1 ? 'o' : 'i'}</span>}
            </div>
          </div>
        </div>
        <span className="bg-white/10 text-slate-400 text-xs px-2 py-1 rounded-md">{payments.length}</span>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2 pl-2">
          {payments.map((payment) => <PaymentItem key={payment.id} payment={payment} onDelete={onDelete} onUpdate={onUpdate} />)}
          {(totalPaid > 0 || totalToPay > 0) && (
            <div className="glass rounded-xl p-3 mt-2 flex justify-between text-sm">
              <div className="flex gap-4">
                {totalPaid > 0 && <span className="text-emerald-400">✓ Pagato: <strong>{centsToEuros(totalPaid)}</strong></span>}
                {totalToPay > 0 && <span className="text-orange-400">○ Da pagare: <strong>{centsToEuros(totalToPay)}</strong></span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ ADD PAYMENT FORM ============

function AddPaymentForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setDueDate(new Date().toISOString().split('T')[0]); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAdd({ title: title.trim(), due_date: dueDate, amount_cents: eurosToCents(amount), notes: null });
      setTitle(''); setAmount('');
    } finally { setIsSubmitting(false); }
  };

  const inputBase = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all";

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-5">
      <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
        <PlusIcon className="w-5 h-5 text-orange-400" />
        Aggiungi pagamento
      </h2>
      <div className="space-y-3">
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titolo pagamento *" required className={inputBase} />
        <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="€ Importo" inputMode="decimal" className={inputBase} />
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className={`${inputBase} appearance-none`} />
        <button type="submit" disabled={isSubmitting || !title.trim() || !dueDate} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 glow-sm-orange disabled:shadow-none flex items-center justify-center gap-2">
          {isSubmitting ? <><RefreshIcon className="w-5 h-5" spinning />Salvataggio...</> : <><PlusIcon className="w-5 h-5" />Salva</>}
        </button>
      </div>
    </form>
  );
}

// ============ NOTIFICATION BUTTON ============

function NotificationButton() {
  const [status, setStatus] = useState('loading');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => { checkStatus(); }, []);

  const checkStatus = async () => {
    if (!isPushSupported()) { setStatus('unsupported'); return; }
    const permission = getPermissionStatus();
    if (permission === 'denied') { setStatus('denied'); return; }
    const subscribed = await isSubscribed();
    setStatus(subscribed ? 'subscribed' : 'unsubscribed');
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const result = await subscribeToNotifications();
      if (result.success) { setStatus('subscribed'); }
      else if (result.message?.includes('negato')) { setStatus('denied'); }
    } finally { setIsSubscribing(false); }
  };

  if (status === 'loading') return null;
  if (status === 'unsupported') return <div className="text-xs text-slate-500 flex items-center gap-1"><BellOffIcon className="w-4 h-4" />Non supportato</div>;
  if (status === 'denied') return <div className="text-xs text-red-400 flex items-center gap-1"><BellOffIcon className="w-4 h-4" />Bloccate</div>;
  if (status === 'subscribed') return <div className="text-xs text-emerald-400 flex items-center gap-1"><BellIcon className="w-4 h-4" />Attive</div>;

  return (
    <button onClick={handleSubscribe} disabled={isSubscribing} className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors disabled:opacity-50">
      {isSubscribing ? <RefreshIcon className="w-4 h-4" spinning /> : <BellIcon className="w-4 h-4" />}
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

  const showToast = useCallback((message, type = 'info') => { setToast({ message, type }); }, []);

  const loadPayments = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    setError(null);
    try { const data = await getPayments(); setPayments(data); }
    catch (err) { setError(err.message); showToast(err.message, 'error'); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, [showToast]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const groupedPayments = useMemo(() => {
    const groups = {};
    payments.forEach(payment => {
      const date = new Date(payment.due_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(payment);
    });
    const sortedKeys = Object.keys(groups).sort();
    const sortedGroups = {};
    sortedKeys.forEach(key => { sortedGroups[key] = groups[key]; });
    return sortedGroups;
  }, [payments]);

  const handleAddPayment = async (paymentData) => {
    try { await createPayment(paymentData); showToast('Pagamento aggiunto!', 'success'); await loadPayments(); }
    catch (err) { showToast(err.message, 'error'); throw err; }
  };

  const handleUpdatePayment = async (paymentData) => {
    try { await updatePayment(paymentData); showToast('Pagamento aggiornato!', 'success'); await loadPayments(); }
    catch (err) { showToast(err.message, 'error'); throw err; }
  };

  const handleDeletePayment = async (paymentId) => {
    try { await deletePayment(paymentId); showToast('Pagamento eliminato', 'info'); await loadPayments(); }
    catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="glass sticky top-0 z-40 border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/10">
                <img src="/icon-192.png" alt="PayAlert" className="w-full h-full object-cover" draggable="false" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display font-bold text-xl text-white truncate">PayAlert</h1>
              </div>
            </div>
            <NotificationButton />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <AddPaymentForm onAdd={handleAddPayment} />

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <span className="text-slate-300">Pagamenti</span>
              {payments.length > 0 && <span className="bg-white/10 text-slate-400 text-xs px-2 py-0.5 rounded-md">{payments.length}</span>}
            </h2>
            <button onClick={() => loadPayments(true)} disabled={isRefreshing} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white disabled:opacity-50">
              <RefreshIcon className="w-5 h-5" spinning={isRefreshing} />
            </button>
          </div>

          {error && !isLoading && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-4">
              <p className="font-medium">Errore di caricamento</p>
              <p className="text-red-400/70 mt-1">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="glass rounded-xl p-8 flex flex-col items-center justify-center">
              <RefreshIcon className="w-8 h-8 text-orange-400 mb-3" spinning />
              <p className="text-slate-400 text-sm">Caricamento...</p>
            </div>
          )}

          {!isLoading && !error && payments.length === 0 && (
            <div className="glass rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCardIcon className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400 mb-2">Nessun pagamento</p>
              <p className="text-slate-500 text-sm">Aggiungi il tuo primo pagamento</p>
            </div>
          )}

          {!isLoading && Object.keys(groupedPayments).length > 0 && (
            <div>
              {Object.entries(groupedPayments).map(([monthKey, monthPayments]) => (
                <MonthGroup key={monthKey} monthKey={monthKey} payments={monthPayments} onDelete={handleDeletePayment} onUpdate={handleUpdatePayment} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="text-center py-4 text-xs text-slate-600">PayAlert © {new Date().getFullYear()}</footer>
    </div>
  );
}