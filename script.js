document.addEventListener('DOMContentLoaded', () => {
  // =======================================================================
  // 1. DECLARACIÓN DE ELEMENTOS DEL DOM (HTML)
  // =======================================================================
  const authSection = document.getElementById('auth-section');
  const appSection = document.getElementById('app-section');
  const appTitle = document.getElementById('app-title');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showLoginBtn = document.getElementById('show-login-btn');
  const showRegisterBtn = document.getElementById('show-register-btn');
  const userInfo = document.getElementById('user-info');
  const userDisplay = document.getElementById('user-display');
  const logoutBtn = document.getElementById('logout-btn');
  const themeToggle = document.getElementById('theme-toggle');
  
  const matriculaForm = document.getElementById('matricula-form');
  const mainSubmitBtn = document.getElementById('main-submit-btn');
  const serviceCheckboxes = document.querySelectorAll('.service-calc');
  const discountCheck = document.getElementById('discount-check');
  const summarySubtotal = document.getElementById('summary-subtotal');
  const summaryDiscount = document.getElementById('summary-discount');
  const summaryTax = document.getElementById('summary-tax');
  const summaryTotal = document.getElementById('summary-total');
  const historyTbody = document.getElementById('history-tbody');
  
  const previewModal = document.getElementById('preview-modal');
  const cancelPreviewBtn = document.getElementById('cancel-preview-btn');
  const printOnlyBtn = document.getElementById('print-only-btn');
  const confirmPrintBtn = document.getElementById('confirm-print-btn');

  let currentInvoice = null;
  let editingId = null;

  // =======================================================================
  // 2. MODO OSCURO
  // =======================================================================
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = 'Modo Claro';
  }

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? 'Modo Claro' : 'Modo Oscuro';
  });

  // =======================================================================
  // 3. CONMUTADOR DE VISTAS LOGIN / REGISTRO
  // =======================================================================
  showLoginBtn.addEventListener('click', () => {
    showLoginBtn.classList.add('active');
    showRegisterBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  });

  showRegisterBtn.addEventListener('click', () => {
    showRegisterBtn.classList.add('active');
    showLoginBtn.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  });

  // =======================================================================
  // 4. REGISTRO DE USUARIOS
  // =======================================================================
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const role = document.getElementById('reg-role').value;
    const email = document.getElementById('reg-email').value;
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const users = JSON.parse(localStorage.getItem('users_db')) || [];

    if (users.some((u) => u.username === username)) {
      alert('El nombre de usuario ya existe. Elija otro.');
      return;
    }

    users.push({ role, email, username, password });
    localStorage.setItem('users_db', JSON.stringify(users));
    alert('¡Registro exitoso! Ya puedes iniciar sesión.');
    registerForm.reset();
    showLoginBtn.click();
  });

  // =======================================================================
  // 5. INICIO DE SESIÓN Y CONTROL DE ROLES
  // =======================================================================
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const users = JSON.parse(localStorage.getItem('users_db')) || [];

    const validUser = users.find(
      (u) => u.username === username && u.password === password
    );

    if (validUser) {
      validUser.role = validUser.role || 'secretario';
      sessionStorage.setItem('active_session', JSON.stringify(validUser));
      checkSession();
    } else {
      alert('Credenciales incorrectas. Verifique usuario y contraseña.');
    }
  });

  function checkSession() {
    const activeUser = JSON.parse(sessionStorage.getItem('active_session'));
    if (activeUser) {
      authSection.classList.add('hidden');
      appSection.classList.remove('hidden');
      userInfo.classList.remove('hidden');
      
      const rolesTraducidos = { admin: "Administrador", secretario: "Secretario", director: "Director" };
      userDisplay.textContent = `${rolesTraducidos[activeUser.role]}: ${activeUser.username}`;
      
      if (activeUser.role === 'director') {
        matriculaForm.classList.add('hidden');
        appTitle.textContent = "Panel de Dirección: Reportes e Historial";
      } else {
        matriculaForm.classList.remove('hidden');
        appTitle.textContent = "Gestión de Matrícula y Cobro de Cuotas";
      }

      loadHistoryTable();
      calculateTotals();
    } else {
      authSection.classList.remove('hidden');
      appSection.classList.add('hidden');
      userInfo.classList.add('hidden');
    }
  }

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('active_session');
    checkSession();
  });

  // =======================================================================
  // 6. CÁLCULO FINANCIERO EN TIEMPO REAL
  // =======================================================================
  function calculateTotals() {
    let subtotal = 0;
    
    serviceCheckboxes.forEach((cb) => {
      if (cb.checked) {
        subtotal += parseFloat(cb.value);
      }
    });

    const discountPercentage = discountCheck.checked ? 0.05 : 0.0;
    const discountAmount = subtotal * discountPercentage;
    const subtotalWithDiscount = subtotal - discountAmount;

    const taxAmount = subtotalWithDiscount * 0.13;
    const total = subtotalWithDiscount + taxAmount;

    summarySubtotal.textContent = `$${subtotal.toFixed(2)}`;
    summaryDiscount.textContent = `-$${discountAmount.toFixed(2)}`;
    summaryTax.textContent = `$${taxAmount.toFixed(2)}`;
    summaryTotal.textContent = `$${total.toFixed(2)}`;

    return { subtotal, discountAmount, taxAmount, total };
  }

  serviceCheckboxes.forEach((cb) => cb.addEventListener('change', calculateTotals));
  discountCheck.addEventListener('change', calculateTotals);

  // =======================================================================
  // 7. GENERACIÓN DE VISTA PREVIA
  // =======================================================================
  matriculaForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const studentName = document.getElementById('student-name').value;
    const studentNie = document.getElementById('student-nie').value;
    const studentPhone = document.getElementById('student-phone').value;
    const studentEmail = document.getElementById('student-email').value;
    const gradeLevel = document.getElementById('grade-level').value;
    const guardianName = document.getElementById('guardian-name').value;
    const observations = document.getElementById('observations').value;

    const totals = calculateTotals();
    const selectedServices = [];
    const selectedServiceNames = [];

    serviceCheckboxes.forEach((cb) => {
      if (cb.checked) {
        selectedServices.push(`${cb.dataset.name} ($${parseFloat(cb.value).toFixed(2)})`);
        selectedServiceNames.push(cb.dataset.name);
      }
    });

    currentInvoice = {
      id: editingId ? editingId : Date.now(),
      date: new Date().toLocaleDateString('es-SV') + ' ' + new Date().toLocaleTimeString(),
      studentName,
      studentNie,
      studentPhone,
      studentEmail,
      gradeLevel,
      guardianName,
      observations,
      services: selectedServices,
      selectedServiceNames: selectedServiceNames,
      subtotal: totals.subtotal.toFixed(2),
      discount: totals.discountAmount.toFixed(2),
      tax: totals.taxAmount.toFixed(2),
      total: totals.total.toFixed(2),
    };

    renderModalData(currentInvoice);

    cancelPreviewBtn.textContent = "Cancelar y Editar";
    confirmPrintBtn.classList.remove('hidden');
    printOnlyBtn.classList.add('hidden');
    
    previewModal.classList.remove('hidden');
  });

  // =======================================================================
  // 8. ACCIONES DEL MODAL
  // =======================================================================
  cancelPreviewBtn.addEventListener('click', () => {
    previewModal.classList.add('hidden');
  });

  printOnlyBtn.addEventListener('click', () => {
    window.print();
  });

  confirmPrintBtn.addEventListener('click', () => {
    const records = JSON.parse(localStorage.getItem('matriculas_db')) || [];
    
    if (editingId) {
      const index = records.findIndex(r => r.id === editingId);
      if(index !== -1) records[index] = currentInvoice;
    } else {
      records.push(currentInvoice);
    }
    
    localStorage.setItem('matriculas_db', JSON.stringify(records));
    loadHistoryTable();

    window.print(); 

    previewModal.classList.add('hidden');
    matriculaForm.reset();
    calculateTotals();
    
    editingId = null;
    mainSubmitBtn.textContent = "Generar Vista Previa de Comprobante";
  });

  // =======================================================================
  // 9. FUNCIONES GLOBALES PARA EL HISTORIAL
  // =======================================================================
  function renderModalData(rec) {
    document.getElementById('rec-date').textContent = rec.date;
    document.getElementById('rec-student').textContent = rec.studentName;
    document.getElementById('rec-nie').textContent = rec.studentNie;
    document.getElementById('rec-phone').textContent = rec.studentPhone;
    document.getElementById('rec-email').textContent = rec.studentEmail;
    document.getElementById('rec-grade').textContent = rec.gradeLevel;
    document.getElementById('rec-guardian').textContent = rec.guardianName;

    const servicesList = document.getElementById('rec-services-list');
    servicesList.innerHTML = '';
    rec.services.forEach((s) => {
      const li = document.createElement('li');
      li.textContent = s;
      servicesList.appendChild(li);
    });

    document.getElementById('rec-subtotal').textContent = `$${rec.subtotal}`;
    document.getElementById('rec-discount').textContent = `-$${rec.discount}`;
    document.getElementById('rec-tax').textContent = `$${rec.tax}`;
    document.getElementById('rec-total').textContent = `$${rec.total}`;
  }

  window.printRecord = function(id) {
    const records = JSON.parse(localStorage.getItem('matriculas_db')) || [];
    const rec = records.find(r => r.id === id);
    if (!rec) return;

    renderModalData(rec);

    cancelPreviewBtn.textContent = "Cerrar";
    confirmPrintBtn.classList.add('hidden');
    printOnlyBtn.classList.remove('hidden'); 

    previewModal.classList.remove('hidden');
  };

  // EDITAR REGISTRO (SOLO PERMITIDO PARA ADMINISTRADOR)
  window.editRecord = function(id) {
    const activeUser = JSON.parse(sessionStorage.getItem('active_session'));
    if (activeUser && activeUser.role === 'secretario') {
      alert('El rol de Secretario no tiene permisos para editar registros.');
      return;
    }

    const records = JSON.parse(localStorage.getItem('matriculas_db')) || [];
    const rec = records.find(r => r.id === id);
    if (!rec) return;

    document.getElementById('student-name').value = rec.studentName;
    document.getElementById('student-nie').value = rec.studentNie;
    document.getElementById('student-phone').value = rec.studentPhone;
    document.getElementById('student-email').value = rec.studentEmail;
    document.getElementById('grade-level').value = rec.gradeLevel;
    document.getElementById('guardian-name').value = rec.guardianName;
    document.getElementById('observations').value = rec.observations || '';

    serviceCheckboxes.forEach(cb => {
      if (rec.selectedServiceNames.includes(cb.dataset.name)) {
        cb.checked = true;
      } else {
        if(cb.dataset.name !== "Matrícula Anual Inicial") {
          cb.checked = false;
        }
      }
    });

    discountCheck.checked = parseFloat(rec.discount) > 0;
    calculateTotals();

    editingId = id;
    mainSubmitBtn.textContent = "Actualizar Comprobante de Matrícula";
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ELIMINAR REGISTRO (SOLO ADMIN)
  window.deleteRecord = function(id) {
    if (confirm("¿Estás completamente seguro de borrar esta matrícula? No se puede deshacer.")) {
      let records = JSON.parse(localStorage.getItem('matriculas_db')) || [];
      records = records.filter(r => r.id !== id);
      localStorage.setItem('matriculas_db', JSON.stringify(records));
      loadHistoryTable();
    }
  };

  // =======================================================================
  // 10. GENERADOR DE TABLA (HISTORIAL)
  // =======================================================================
  function loadHistoryTable() {
    const records = JSON.parse(localStorage.getItem('matriculas_db')) || [];
    historyTbody.innerHTML = '';
    
    const activeUser = JSON.parse(sessionStorage.getItem('active_session'));
    const isAdmin = activeUser && activeUser.role === 'admin';

    records.forEach(rec => {
      const tr = document.createElement('tr');
      
      let actionButtons = `<button class="btn-info" onclick="printRecord(${rec.id})">Imprimir</button>`;
      
      // Solo el Administrador puede editar los registros
      if (isAdmin) {
        actionButtons += `<button class="btn-warning" onclick="editRecord(${rec.id})">Editar</button>`;
        actionButtons += `<button class="btn-danger" onclick="deleteRecord(${rec.id})">Borrar</button>`;
      }

      tr.innerHTML = `
        <td>${rec.date}</td>
        <td>${rec.studentName}</td>
        <td>${rec.studentNie}</td>
        <td>${rec.gradeLevel}</td>
        <td><strong>$${rec.total}</strong></td>
        <td>${actionButtons}</td>
      `;
      historyTbody.appendChild(tr);
    });
  }

  checkSession();
});