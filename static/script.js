// DOM Elements
const themeToggle = document.getElementById("themeIcon");
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const loginModal = document.getElementById("loginModal");
const registerModal = document.getElementById("registerModal");
const purchaseModal = document.getElementById("purchaseModal");
const closeButtons = document.querySelectorAll(".close");
const switchToRegister = document.getElementById("switchToRegister");
const switchToLogin = document.getElementById("switchToLogin");
const exploreBtn = document.getElementById("exploreBtn");
const searchInput = document.getElementById("searchInput");
const templatesGrid = document.getElementById("templatesGrid");
const proceedToPayment = document.getElementById("proceedToPayment");
const confirmPayment = document.getElementById("confirmPayment");
const downloadTemplate = document.getElementById("downloadTemplate");
const customerForm = document.getElementById("customerForm");
const paymentContent = document.getElementById("paymentContent");
const downloadContent = document.getElementById("downloadContent");

// Sample templates data
const templates = [
  {
    id: 1,
    name: "Бизнес Портфолио",
    description: "Современный шаблон для презентации вашего бизнеса",
    price: 2990,
    category: "бизнес",
  },
  {
    id: 2,
    name: "Интернет-магазин",
    description: "Полнофункциональный шаблон для электронной коммерции",
    price: 4990,
    category: "магазин",
  },
  {
    id: 3,
    name: "Корпоративный сайт",
    description: "Профессиональный шаблон для корпоративных клиентов",
    price: 3990,
    category: "корпоративный",
  },
  {
    id: 4,
    name: "Блог Платформа",
    description: "Элегантный шаблон для ведения блога",
    price: 2490,
    category: "блог",
  },
  {
    id: 5,
    name: "Лендинг Пейдж",
    description: "Высококонверсионный лендинг для вашего продукта",
    price: 1990,
    category: "лендинг",
  },
  {
    id: 6,
    name: "Портфолио Фрилансера",
    description: "Креативный шаблон для демонстрации работ",
    price: 2790,
    category: "портфолио",
  },
];

// Theme Toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
  if (document.body.classList.contains("dark-theme")) {
    themeToggle.classList.remove("fa-moon");
    themeToggle.classList.add("fa-sun");
  } else {
    themeToggle.classList.remove("fa-sun");
    themeToggle.classList.add("fa-moon");
  }
});

// Mobile Menu Toggle
hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");
});

// Close mobile menu when clicking on a link
document.querySelectorAll(".nav-menu a").forEach((link) => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
  });
});

// Modal Functions
function openModal(modal) {
  modal.style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeModal(modal) {
  modal.style.display = "none";
  document.body.style.overflow = "auto";
}

// Event Listeners for Modals
loginBtn.addEventListener("click", () => openModal(loginModal));
registerBtn.addEventListener("click", () => openModal(registerModal));

closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const modal = button.closest(".modal");
    closeModal(modal);
  });
});

switchToRegister.addEventListener("click", (e) => {
  e.preventDefault();
  closeModal(loginModal);
  openModal(registerModal);
});

switchToLogin.addEventListener("click", (e) => {
  e.preventDefault();
  closeModal(registerModal);
  openModal(loginModal);
});

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    closeModal(e.target);
  }
});

// Explore Templates Button
exploreBtn.addEventListener("click", () => {
  document.getElementById("templates").scrollIntoView({ behavior: "smooth" });
});

// Render Templates
function renderTemplates(templatesToRender) {
  templatesGrid.innerHTML = "";

  templatesToRender.forEach((template) => {
    const templateCard = document.createElement("div");
    templateCard.className = "template-card fade-in";
    templateCard.innerHTML = `
            <div class="template-image"></div>
            <div class="template-info">
                <h3>${template.name}</h3>
                <p>${template.description}</p>
                <div class="template-price">
                    <span class="price">${template.price.toLocaleString()} руб.</span>
                    <button class="btn-primary buy-btn" data-id="${
                      template.id
                    }">Купить</button>
                </div>
            </div>
        `;
    templatesGrid.appendChild(templateCard);
  });

  // Add event listeners to buy buttons
  document.querySelectorAll(".buy-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const templateId = parseInt(e.target.getAttribute("data-id"));
      openPurchaseModal(templateId);
    });
  });

  // Add scroll animations
  setTimeout(() => {
    document.querySelectorAll(".fade-in").forEach((el) => {
      el.classList.add("visible");
    });
  }, 100);
}

// Open Purchase Modal
function openPurchaseModal(templateId) {
  const template = templates.find((t) => t.id === templateId);
  if (!template) return;

  // Reset modal state
  customerForm.style.display = "block";
  paymentContent.style.display = "none";
  downloadContent.style.display = "none";

  // Set template info
  document.querySelector(
    "#purchaseModal h2"
  ).textContent = `Покупка: ${template.name}`;

  // Store current template ID for purchase
  currentTemplateId = templateId;

  openModal(purchaseModal);
}

// Proceed to Payment
proceedToPayment.addEventListener("click", async () => {
  // Validate form
  const nameInput = customerForm.querySelector('input[type="text"]');
  const emailInput = customerForm.querySelector('input[type="email"]');

  if (!nameInput.value || !emailInput.value) {
    alert("Пожалуйста, заполните все поля");
    return;
  }

  // Check if user is logged in
  try {
    const response = await fetch("/api/user");
    const data = await response.json();

    if (!data.success) {
      // User not logged in, show login modal
      closeModal(purchaseModal);
      openModal(loginModal);
      return;
    }

    // User is logged in, proceed to payment
    customerForm.style.display = "none";
    paymentContent.style.display = "block";
    generateQRCode();
  } catch (error) {
    console.error("Error checking user auth:", error);
    alert("Ошибка проверки авторизации");
  }
});

// Confirm Payment
confirmPayment.addEventListener("click", async () => {
  try {
    const response = await fetch("/api/purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_id: currentTemplateId,
      }),
    });

    const data = await response.json();

    if (data.success) {
      paymentContent.style.display = "none";
      downloadContent.style.display = "block";

      // Update download button text
      document.querySelector(
        "#downloadTemplate"
      ).textContent = `Скачать ${data.template_name}`;
    } else {
      alert("Ошибка оплаты: " + data.message);
    }
  } catch (error) {
    console.error("Purchase error:", error);
    alert("Ошибка при обработке покупки");
  }
});

// Download Template
downloadTemplate.addEventListener("click", async () => {
  try {
    const response = await fetch(`/api/download/${currentTemplateId}`);
    const data = await response.json();

    if (data.success) {
      alert(data.message);
      closeModal(purchaseModal);

      // In a real app, you would trigger the actual download
      // window.location.href = data.download_url;
    } else {
      alert("Ошибка скачивания: " + data.message);
    }
  } catch (error) {
    console.error("Download error:", error);
    alert("Ошибка при скачивании шаблона");
  }
});

// Update login/logout functionality
async function checkAuthStatus() {
  try {
    const response = await fetch("/api/user");
    const data = await response.json();

    if (data.success) {
      // User is logged in
      document.getElementById("loginBtn").style.display = "none";
      document.getElementById("registerBtn").style.display = "none";

      // Create user menu
      const userMenu = document.createElement("div");
      userMenu.className = "user-menu";
      userMenu.innerHTML = `
                <span>Привет, ${data.user.username}</span>
                <a href="/dashboard" class="btn-secondary">Кабинет</a>
                <button class="btn-logout" onclick="logout()">Выйти</button>
            `;

      document.querySelector(".nav-actions").appendChild(userMenu);
    }
  } catch (error) {
    console.error("Auth check error:", error);
  }
}

async function logout() {
  try {
    await fetch("/logout");
    window.location.reload();
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// Initialize auth status on page load
document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus();
  // ... остальной код инициализации
});
// Generate QR Code (placeholder implementation)
function generateQRCode() {
  const qrContainer = document.getElementById("qrCodeContainer");
  qrContainer.innerHTML = `
        <div style="width: 200px; height: 200px; margin: 0 auto; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border-radius: 10px;">
            <div style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 10px;">💰</div>
                <p style="font-size: 0.9rem;">QR-код для оплаты</p>
            </div>
        </div>
    `;

  // In a real implementation, you would use a QR code library like qrcode.js
  // Example:
  // QRCode.toCanvas(qrContainer, "https://your-payment-link.com", function(error) {
  //   if (error) console.error(error);
  // });
}

// Confirm Payment
confirmPayment.addEventListener("click", () => {
  paymentContent.style.display = "none";
  downloadContent.style.display = "block";
});

// Download Template
downloadTemplate.addEventListener("click", () => {
  alert(
    "Шаблон скачивается... В реальном приложении здесь будет ссылка для скачивания."
  );
  closeModal(purchaseModal);
});

// Search Functionality
searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.category.toLowerCase().includes(searchTerm)
  );
  renderTemplates(filteredTemplates);
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    const targetId = this.getAttribute("href");
    if (targetId === "#") return;

    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Scroll Animation
function checkScroll() {
  const elements = document.querySelectorAll(".fade-in");

  elements.forEach((element) => {
    const elementTop = element.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;

    if (elementTop < windowHeight - 100) {
      element.classList.add("visible");
    }
  });
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Render templates
  renderTemplates(templates);

  // Add scroll event listener
  window.addEventListener("scroll", checkScroll);
  checkScroll(); // Check on initial load
});
