const reservationForm = document.getElementById('reservationForm');
const confirmationBox = document.getElementById('confirmation');
const savedReservationsList = document.getElementById('savedReservations');
const whatsappButton = document.getElementById('whatsappButton');
const hotelCards = document.getElementById('hotelCards');
const searchGuests = document.getElementById('searchGuests');
const searchArea = document.getElementById('searchArea');
const searchCheckIn = document.getElementById('searchCheckIn');

const STORAGE_KEY = 'bookmauritius-reservations';
const COMMISSION_RATE = 0.10;
const PAYMENT_NUMBER = '23058023676';

const hotels = [
  { name: 'Azure Coast Resort', area: 'north', price: 4800, rating: '4.8', description: 'Ocean view suites in the north of Mauritius.' },
  { name: 'Lagoon Palm Hotel', area: 'south', price: 5200, rating: '4.7', description: 'Relaxing beachfront stay for couples and families.' },
  { name: 'Capital Bay Hotel', area: 'port-louis', price: 3900, rating: '4.5', description: 'City convenience with easy access to dining.' },
  { name: 'Tropical Haven Suites', area: 'north', price: 5600, rating: '4.9', description: 'Premium villas for luxury island stays.' },
];

function getReservations() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function saveReservations(reservations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
}

function calculateStayLength(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-MU', {
    style: 'currency',
    currency: 'MUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function buildWhatsAppLink(reservation) {
  const message = [
    'Hello, I would like to make a reservation in Mauritius.',
    `Name: ${reservation.name}`,
    `Phone: ${reservation.phone}`,
    `Hotel: ${reservation.hotelName}`,
    `Room: ${reservation.roomType}`,
    `Guests: ${reservation.guests}`,
    `Check-in: ${reservation.checkIn}`,
    `Check-out: ${reservation.checkOut}`,
    `Stay nights: ${reservation.nights}`,
    `Booking total: ${reservation.bookingTotal}`,
    `Payment method: ${reservation.paymentMethod}`,
  ].join('\n');

  return `https://wa.me/${PAYMENT_NUMBER}?text=${encodeURIComponent(message)}`;
}

function renderHotels() {
  const area = searchArea.value;
  const guests = Number(searchGuests.value || 1);

  const filteredHotels = hotels.filter((hotel) => {
    const areaMatch = area === 'all' || hotel.area === area;
    const guestMatch = guests >= 1;
    return areaMatch && guestMatch;
  });

  hotelCards.innerHTML = filteredHotels
    .map(
      (hotel) => `
        <article class="hotel-card">
          <div class="hotel-card-top">
            <div>
              <h3>${hotel.name}</h3>
              <div class="hotel-meta">⭐ ${hotel.rating} · ${hotel.area}</div>
            </div>
            <div class="hotel-price">${formatCurrency(hotel.price)}/night</div>
          </div>
          <p class="hotel-meta">${hotel.description}</p>
          <button class="reserve-btn" data-hotel="${hotel.name}" data-rate="${hotel.price}">Reserve</button>
        </article>
      `
    )
    .join('');

  hotelCards.querySelectorAll('[data-hotel]').forEach((button) => {
    button.addEventListener('click', () => {
      document.getElementById('hotelName').value = button.dataset.hotel;
      document.getElementById('nightlyRate').value = button.dataset.rate;
      document.getElementById('reservationForm').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function renderReservations() {
  const reservations = getReservations();

  if (reservations.length === 0) {
    savedReservationsList.innerHTML = '<li>No reservations yet.</li>';
    return;
  }

  savedReservationsList.innerHTML = reservations
    .slice()
    .reverse()
    .map(
      (reservation) => `
        <li>
          <strong>${reservation.name}</strong><br />
          ${reservation.hotelName} · ${reservation.roomType}<br />
          ${reservation.checkIn} → ${reservation.checkOut}
        </li>
      `
    )
    .join('');
}

reservationForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const checkIn = document.getElementById('checkIn').value;
  const checkOut = document.getElementById('checkOut').value;
  const nights = calculateStayLength(checkIn, checkOut);
  const nightlyRate = Number(document.getElementById('nightlyRate').value || 0);
  const bookingTotal = nights * nightlyRate;
  const commission = Math.round(bookingTotal * COMMISSION_RATE);
  const hotelPayout = Math.max(bookingTotal - commission, 0);

  const reservation = {
    name: document.getElementById('name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    hotelName: document.getElementById('hotelName').value.trim(),
    nightlyRate,
    checkIn,
    checkOut,
    nights,
    guests: document.getElementById('guests').value,
    roomType: document.getElementById('roomType').value,
    paymentMethod: document.getElementById('paymentMethod').value,
    bookingTotal: formatCurrency(bookingTotal),
    commission: formatCurrency(commission),
    hotelPayout: formatCurrency(hotelPayout),
  };

  const reservations = getReservations();
  reservations.push(reservation);
  saveReservations(reservations);
  renderReservations();

  confirmationBox.innerHTML = `
    <h3>Reservation confirmed</h3>
    <p><strong>${reservation.name}</strong>, your ${reservation.roomType.toLowerCase()} room in <strong>${reservation.hotelName}</strong> is reserved for ${reservation.guests} guest(s).</p>
    <p>Stay: ${reservation.checkIn} → ${reservation.checkOut} (${reservation.nights} night(s))</p>
    <p>Booking total: <strong>${reservation.bookingTotal}</strong></p>
    <p>Payment method: ${reservation.paymentMethod}</p>
    <p>WhatsApp payment number: <strong>+230 58023676</strong></p>
    <p>Booking email: <strong>bookmauritius@outlook.com</strong></p>
    <p>Guest contact: ${reservation.phone} / ${reservation.email}</p>
  `;

  whatsappButton.href = buildWhatsAppLink(reservation);

  reservationForm.reset();
  document.getElementById('nightlyRate').value = '4500';
});

searchArea.addEventListener('change', renderHotels);
searchGuests.addEventListener('change', renderHotels);
searchCheckIn.addEventListener('change', () => {
  document.getElementById('checkIn').value = searchCheckIn.value;
});

renderHotels();
renderReservations();
