// --- Константы ---
const RATE = 0.20; // 20% годовых
const MIN_AMOUNT = 1000;
const MAX_AMOUNT = 300000;
const TERMS = [3, 6, 9, 12];
const STORAGE_KEY = 'installment-completed';

// --- Состояние ---
let state = {
  amount: 40000,
  term: 12,
  payment: null,
  serviceFee: null
};

// --- Утилиты ---
function formatMoney(num) {
  return num.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });
}
function formatMoneyPrecise(num) {
  return num.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 });
}

function calcPayment(amount, term) {
  const monthlyRate = RATE / 12;
  const n = term;
  const payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  return Math.round(payment);
}
function calcServiceFee(amount, term) {
  // Сумма всех процентов за год (если срок < 12 мес — пропорционально)
  const totalInterest = amount * RATE * (term / 12);
  return totalInterest;
}

// --- Рендеринг ---
function render() {
  if (localStorage.getItem(STORAGE_KEY) === 'true') {
    renderSuccess();
    return;
  }
  const hash = location.hash.replace('#', '');
  if (hash === 'confirm') {
    renderConfirm();
  } else if (hash === 'success') {
    renderSuccess();
  } else {
    renderCalculator();
  }
}

function renderCalculator() {
  // Сохраняем фокус и позицию курсора
  let selectionStart = null, selectionEnd = null, wasFocused = false;
  const amountInput = document.getElementById('amount');
  if (amountInput && document.activeElement === amountInput) {
    wasFocused = true;
    selectionStart = amountInput.selectionStart;
    selectionEnd = amountInput.selectionEnd;
  }
  state.payment = calcPayment(state.amount, state.term);
  state.serviceFee = calcServiceFee(state.amount, state.term);
  document.title = 'Рассрочка';
  // Проверка валидности суммы
  const amountNum = parseInt(state.amount, 10);
  const isAmountValid = amountNum >= MIN_AMOUNT && amountNum <= MAX_AMOUNT;
  document.getElementById('app').innerHTML = `
    <h2 class="screen-title">Получите до&nbsp;300&nbsp;000&nbsp;₽&nbsp;в&nbsp;рассрочку</h2>
    <p style="margin-bottom:24px;">Деньги придут на вашу карту. И не нужно идти в банк</p>
    <label for="amount" style="color:#888;font-size:1.1rem;">Введите сумму</label>
    <input id="amount" type="number" value="${state.amount}" autocomplete="off" class="${isAmountValid ? '' : 'input-error'}" />
    <div style="color:#888;font-size:1rem;margin-bottom:16px;">от 1 000 ₽ до 300 000 ₽</div>
    <div style="color:#888;font-size:1.1rem;">Выберите срок</div>
    <div class="term-btns">
      ${TERMS.map(term => `<button class="term-btn${state.term === term ? ' selected' : ''}" data-term="${term}">${term} мес</button>`).join('')}
    </div>
    <div class="card">
      <div class="card-title">${formatMoney(state.payment)} в месяц</div>
      <small>включая плату за услугу</small>
    </div>
    <button class="button" id="nextBtn" ${isAmountValid ? '' : 'disabled'}>Продолжить</button>
  `;
  // После рендера восстанавливаем фокус и позицию курсора
  const newAmountInput = document.getElementById('amount');
  if (wasFocused && newAmountInput) {
    newAmountInput.focus();
    if (selectionStart !== null && selectionEnd !== null) {
      newAmountInput.setSelectionRange(selectionStart, selectionEnd);
    }
  }
  document.getElementById('amount').addEventListener('input', e => {
    state.amount = e.target.value;
    renderCalculator();
  });
  document.querySelectorAll('.term-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      state.term = parseInt(btn.dataset.term);
      renderCalculator();
    });
  });
  if (isAmountValid) {
    document.getElementById('nextBtn').addEventListener('click', () => {
      location.hash = 'confirm';
    });
  }
}

function renderConfirm() {
  state.payment = calcPayment(state.amount, state.term);
  state.serviceFee = calcServiceFee(state.amount, state.term);
  document.title = 'Подтверждение';
  document.getElementById('app').innerHTML = `
    <div class="header-row">
      <button id="backBtn" aria-label="Назад">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M19.6799 11H7.96795L13.3439 5.4L11.9999 4L4.31995 12L11.9999 20L13.3439 18.6L7.96795 13H19.6799V11Z" fill="#030306" fill-opacity="0.88"/>
        </svg>
      </button>
    </div>
    <h1 class="screen-title-confirm">Всё проверьте, и можно оформлять</h1>
    <ul class="confirm-list">
      <li><span class="label">Всего в рассрочку</span><span class="value">${formatMoney(state.amount)}</span></li>
      <li><span class="label">Плата за услугу</span><span class="value">${formatMoneyPrecise(state.serviceFee)} в год</span></li>
      <li><span class="label">Платёж в месяц</span><span class="value">${formatMoney(state.payment)}</span></li>
      <li><span class="label">Срок</span><span class="value">${state.term} месяцев</span></li>
    </ul>
    <div style="color:#888;font-size:1.1rem;margin-bottom:8px;">Куда зачислить деньги</div>
    <div class="account-box"><span><span class="ruble">₽</span></span>Текущий счет</div>
    <button class="button" id="submitBtn">Оформить рассрочку</button>
  `;
  document.getElementById('backBtn').addEventListener('click', () => {
    location.hash = '';
  });
  document.getElementById('submitBtn').addEventListener('click', () => {
    location.hash = 'success';
  });
}

function renderSuccess() {
  document.title = 'Спасибо!';
  document.getElementById('app').innerHTML = `
    <img src="img/success.png" alt="Успех" class="success-img">
    <h2 style="text-align:center;">Только тссс</h2>
    <p style="text-align:center;font-size:1.2rem;">Вы поучаствовали в очень важном исследовании, которое поможет улучшить продукт. Вы – наш герой!</p>
  `;
  // Ставим флаг, чтобы при обновлении всегда показывалась заглушка
  localStorage.setItem(STORAGE_KEY, 'true');
  // Блокируем возврат назад
  window.history.pushState(null, '', window.location.href);
  window.onpopstate = function() {
    window.history.go(1);
  };
}

// --- Инициализация ---
window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', () => {
  // Если уже завершено — сразу показываем заглушку
  if (localStorage.getItem(STORAGE_KEY) === 'true') {
    location.hash = 'success';
  }
  render();
}); 