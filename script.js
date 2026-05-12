// Website statis dengan interaksi sederhana

// Menampilkan pesan sambutan sesuai waktu
function updateGreeting() {
  const greetingElement = document.getElementById('greeting');
  const hour = new Date().getHours();
  let timeGreeting = '';

  if (hour < 12) {
    timeGreeting = 'Selamat Pagi ☀️';
  } else if (hour < 18) {
    timeGreeting = 'Selamat Siang 🌤️';
  } else {
    timeGreeting = 'Selamat Malam 🌙';
  }

  if (greetingElement) {
    greetingElement.innerHTML = `${timeGreeting}, Saya <span class="highlight">Mahasiswa Polindra</span> 👋`;
  }
}

// Event klik tombol
function setupButton() {
  const button = document.getElementById('clickMeBtn');
  const message = document.getElementById('message');
  let clickCount = 0;

  if (button) {
    button.addEventListener('click', () => {
      clickCount++;
      message.textContent = `Tombol sudah diklik ${clickCount} kali! Terima kasih sudah berkunjung 🎉`;
      message.style.opacity = '0';
      message.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        message.style.opacity = '1';
      }, 50);
    });
  }
}

// Animasi sederhana saat loading
function animateElements() {
  const card = document.querySelector('.card');
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease';

    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 100);
  }
}

// Menampilkan tahun berjalan di footer
function updateYear() {
  const footer = document.querySelector('footer p');
  if (footer) {
    const year = new Date().getFullYear();
    footer.innerHTML = `&copy; ${year} - Website Statis dengan CI/CD`;
  }
}

// Jalankan semua fungsi saat halaman load
window.addEventListener('DOMContentLoaded', () => {
  updateGreeting();
  setupButton();
  animateElements();
  updateYear();

  // Console log untuk debugging
  console.log('✅ Website statis berhasil dimuat!');
});
