// Ещё один тестовый триггер для деплоя
// Тестовый триггер для деплоя
// --- Константы ---
const RATE = 0.20; // 20% годовых
const MIN_AMOUNT = 1000;
const MAX_AMOUNT = 100000;
const TERMS = [3, 6, 9, 12];
const STORAGE_KEY = 'installment-completed';

// Вариант лендинга
const VARIANT = 'ghk_5639_var1';

// --- Состояние ---
let state = {
  amount: 100000,
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

function sendYMEvent(event, params = {}) {
  if (typeof ym === 'function') {
    ym(96171108, 'reachGoal', event, params);
  }
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
  document.title = 'Рассрочка';
  const app = document.getElementById('app');
  // Если поле уже есть, не пересоздаём всю форму, а только обновляем связанные части
  if (document.getElementById('amount')) {
    const amountNum = parseInt(state.amount, 10);
    const isAmountValid = amountNum >= MIN_AMOUNT && amountNum <= MAX_AMOUNT;
    state.payment = calcPayment(state.amount, state.term);
    state.serviceFee = calcServiceFee(state.amount, state.term);
    document.querySelector('.card-title').textContent = formatMoney(state.payment) + ' в месяц';
    document.querySelector('.card small').textContent = 'включая плату за услугу';
    document.getElementById('amount').className = isAmountValid ? '' : 'input-error';
    document.getElementById('nextBtn').disabled = !isAmountValid;
    // Ререндерим только блок кнопок месяцев
    const termBtns = document.querySelector('.term-btns');
    termBtns.innerHTML = TERMS.map(term => `<button class="term-btn${state.term === term ? ' selected' : ''}" data-term="${term}">${term} мес</button>`).join('');
    termBtns.querySelectorAll('.term-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        state.term = parseInt(btn.dataset.term);
        renderCalculator();
      });
    });
    return;
  }
  // Первый рендер — создаём всю разметку
  // Событие просмотра экрана выбора условий рассрочки только при первом рендере
  if (typeof gtag === 'function') {
    gtag('event', '5639_page_view_choose_loan_var1');
  }
  sendYMEvent('5639_page_view_choose_loan_var1');
  app.innerHTML = `
    <h2 class="screen-title">Получите до&nbsp;100&nbsp;000&nbsp;₽</h2>
    <p style="margin-bottom:24px;">Деньги придут на вашу карту. И не нужно идти в банк</p>
    <label for="amount" style="color:#888;font-size:1.1rem;">Введите сумму</label>
    <input id="amount" type="number" value="${state.amount}" autocomplete="off" />
    <div style="color:#888;font-size:1rem;margin-bottom:16px;">от 1 000 ₽ до 100 000 ₽</div>
    <div style="color:#888;font-size:1.1rem;">Выберите срок</div>
    <div class="term-btns">
      ${TERMS.map(term => `<button class="term-btn${state.term === term ? ' selected' : ''}" data-term="${term}">${term} мес</button>`).join('')}
    </div>
    <div class="card">
      <div class="card-title">${formatMoney(calcPayment(state.amount, state.term))} в месяц</div>
      <small>включая плату за услугу</small>
    </div>
    <button class="button" id="nextBtn">Продолжить</button>
  `;
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
  document.getElementById('nextBtn').addEventListener('click', () => {
    if (typeof gtag === 'function') {
      gtag('event', '5639_click_continue_var1');
    }
    sendYMEvent('5639_click_continue_var1');
    location.hash = 'confirm';
  });
}

function renderConfirm() {
  state.payment = calcPayment(state.amount, state.term);
  state.serviceFee = calcServiceFee(state.amount, state.term);
  document.title = 'Подтверждение';
  setTimeout(() => {
    if (typeof gtag === 'function') {
      gtag('event', '5639_page_view_agreement_var1');
    }
    sendYMEvent('5639_page_view_agreement_var1');
  }, 0);
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
      <li><span class="label">Всего</span><span class="value">${formatMoney(state.amount)}</span></li>
      <li><span class="label">Плата за услугу</span><span class="value">${formatMoneyPrecise(state.serviceFee)}</span></li>
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
    // Делаем кнопку неактивной, чтобы предотвратить повторные отправки
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    // Собираем параметры
    const params = {
      date: new Date().toLocaleString('ru-RU'),
      variant: VARIANT,
      sum: state.amount,
      period: state.term + ' мес',
      payment: state.payment
    };
    if (typeof gtag === 'function') {
      gtag('event', '5639_click_agreement_make_deal_var1', params);
    }
    sendYMEvent('5639_click_agreement_make_deal_var1', params);
    fetch('https://script.google.com/macros/s/AKfycbyxpyRlyk__XIl5Ih7c0RhK8PIAuqOmmr9MH6RaNgIA4rGg75xVW1FOCbvcS8TbEk2b/exec', {
      redirect: 'follow',
      method: 'POST',
      body: JSON.stringify({
        date: params.date,
        variant: params.variant,
        sum: params.sum,
        period: params.period,
        payment: params.payment
      }),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    })
    .then(() => {
      location.hash = 'success';
    })
    .catch(() => { location.hash = 'success'; });
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
  // Событие просмотра финальной страницы
  if (typeof gtag === 'function') {
    gtag('event', '5639_end_page_view_var1');
  }
  sendYMEvent('5639_end_page_view_var1');
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