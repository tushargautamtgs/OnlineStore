// Firebase Init
const firebaseConfig = {
  apiKey: "AIzaSyA0StbmF9z2kK4WMEOpG9qO9XwlAfd",
  authDomain: "ecommerce-492b2.firebaseapp.com",
  databaseURL: "https://resinecomsite-b81db-default-rtdb.firebaseio.com/",
  projectId: "ecommerce-492b2",
  storageBucket: "ecommerce-492b2.appspot.com",
  messagingSenderId: "973139470429",
  appId: "1:973139470429:web:0c1915e57edfd72e6b0cb1"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let selectedOrderId = null;

// Fetch Orders
function fetchOrders() {
  const ordersRef = db.ref("orders");
  const ordersContainer = document.getElementById("ordersContainer");

  ordersRef.once("value", (snapshot) => {
    if (!snapshot.exists()) {
      ordersContainer.innerHTML = "<p>No orders found.</p>";
      return;
    }

    const orders = snapshot.val();
    let tableHTML = `
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Address</th>
            <th>Phone</th>
            <th>Total Amount</th>
            <th>Items</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    `;
 Object.values(orders).forEach(order => {
  if (!order || !order.customer || !order.items || !order.timestamp) {
    console.warn("Incomplete order data found:", order);
    return; // Skip this order
  }

  const { orderId, customer, items, totalAmount, timestamp, status = "In Packing", trackingId = "", courierCompany = "" } = order;

 let itemsHTML = items.map(item => {
  const customization = item.customization ? `<br><small style="color: #888; font-style: italic;">Customize: ${item.customization}</small>` : "";
  return `
    <div>
      ${item.name} (x${item.quantity}) - ₹${item.price * item.quantity}
      ${customization}
    </div>
  `;
}).join('');


  tableHTML += `
    <tr class="order-row"
      data-orderid="${orderId}"
      data-status="${status}"
      data-tracking="${trackingId}"
      data-courier="${courierCompany}">
      <td>${orderId}</td>
      <td>${customer.name}</td>
      <td>${customer.address}</td>
      <td>${customer.phone}</td>
      <td>₹${totalAmount}</td>
      <td>${itemsHTML}</td>
      <td>${new Date(timestamp).toLocaleString()}</td>
      <td>${status}</td>
    </tr>
  `;
});


    tableHTML += `</tbody></table>`;
    ordersContainer.innerHTML = tableHTML;

    // Attach click to each row
    document.querySelectorAll('.order-row').forEach(row => {
      row.addEventListener('click', () => {
        selectedOrderId = row.getAttribute('data-orderid');
        const currentStatus = row.getAttribute('data-status');
        const currentTracking = row.getAttribute('data-tracking') || "";
        const currentCourier = row.getAttribute('data-courier') || "";

        document.getElementById('statusSelect').value = currentStatus;
        document.getElementById('trackingInput').value = currentTracking;
        document.getElementById('courierInput').value = currentCourier;

        // Toggle inputs based on status
        if (currentStatus === 'Shipped') {
          document.getElementById('trackingInput').style.display = 'block';
          document.getElementById('courierInput').style.display = 'block';
        } else {
          document.getElementById('trackingInput').style.display = 'none';
          document.getElementById('courierInput').style.display = 'none';
        }

        // Show modal
        document.getElementById('statusModal').style.display = 'block';
        document.getElementById('overlay').style.display = 'block';
      });
    });
  });
}

// Handle status change
document.getElementById('statusSelect').addEventListener('change', (e) => {
  const selected = e.target.value;
  const trackingInput = document.getElementById('trackingInput');
  const courierInput = document.getElementById('courierInput');

  if (selected === 'Shipped') {
    trackingInput.style.display = 'block';
    courierInput.style.display = 'block';
  } else {
    trackingInput.style.display = 'none';
    courierInput.style.display = 'none';
  }
});

// Update status
document.getElementById('updateStatusBtn').addEventListener('click', () => {
  const status = document.getElementById('statusSelect').value;
  const trackingId = document.getElementById('trackingInput').value.trim();
  const courierCompany = document.getElementById('courierInput').value.trim();

  if (status === 'Shipped') {
    if (!trackingId || !courierCompany) {
      alert("Please enter both Tracking ID and Courier Company.");
      return;
    }
  }

  const updateData = { status };
  if (status === 'Shipped') {
    updateData.trackingId = trackingId;
    updateData.courierCompany = courierCompany;
  }

  db.ref("orders/" + selectedOrderId).update(updateData)
    .then(() => {
      alert("Order status updated!");
      closeModal();
      fetchOrders();
    })
    .catch((err) => {
      console.error("Error updating:", err);
      alert("Update failed!");
    });
});

// Close modal
document.getElementById('overlay').addEventListener('click', closeModal);
function closeModal() {
  document.getElementById('statusModal').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
  selectedOrderId = null;
}

// Initial fetch
fetchOrders();

    // Logout function
    function logout() {
        localStorage.removeItem('adminLoggedIn');
        window.location.href = 'index.html';
    }

    // UI elements references
    const ordersContainer = document.getElementById('ordersContainer');
    const statusModal = document.getElementById('statusModal');
    const overlay = document.getElementById('overlay');
    const statusSelect = document.getElementById('statusSelect');
    const trackingInput = document.getElementById('trackingInput');
    const courierInput = document.getElementById('courierInput');
    const updateStatusBtn = document.getElementById('updateStatusBtn');

    let editingIndex = null;
    let orders = []; // This should be populated from your Firebase in orders.js

    // Helper to create status badge
    function getStatusBadge(status) {
        const safeClass = status.replace(/\s/g, '\\ ');
        return `<span class="status-badge status-${safeClass}">${status}</span>`;
    }

    // Render orders in table
    function renderOrders() {
        ordersContainer.innerHTML = '';
        orders.forEach((order, index) => {
            const trackingText = order.status === 'Shipped' && order.trackingId && order.courier
                ? `${order.trackingId} (${order.courier})`
                : '-';
            ordersContainer.innerHTML += `
              <tr>
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td>${trackingText}</td>
                <td><button class="update-btn" data-index="${index}">Update</button></td>
              </tr>
            `;
        });
        attachUpdateListeners();
    }

    // Attach event listeners to update buttons
    function attachUpdateListeners() {
        const buttons = document.querySelectorAll('.update-btn');
        buttons.forEach(btn => {
            btn.onclick = e => {
                editingIndex = e.target.dataset.index;
                openModal(editingIndex);
            };
        });
    }

    // Open modal and populate with order data
    function openModal(index) {
        const order = orders[index];
        statusSelect.value = order.status;
        if (order.status === 'Shipped') {
            trackingInput.style.display = 'block';
            courierInput.style.display = 'block';
            trackingInput.value = order.trackingId || '';
            courierInput.value = order.courier || '';
        } else {
            trackingInput.style.display = 'none';
            courierInput.style.display = 'none';
            trackingInput.value = '';
            courierInput.value = '';
        }
        statusModal.style.display = 'block';
        overlay.style.display = 'block';
    }

    // Listen for status change to toggle fields
    statusSelect.addEventListener('change', () => {
        if (statusSelect.value === 'Shipped') {
            trackingInput.style.display = 'block';
            courierInput.style.display = 'block';
        } else {
            trackingInput.style.display = 'none';
            courierInput.style.display = 'none';
            trackingInput.value = '';
            courierInput.value = '';
        }
    });

    // Update order status and close modal
    updateStatusBtn.addEventListener('click', () => {
        if (editingIndex === null) return;

        const newStatus = statusSelect.value;
        const newTracking = trackingInput.value.trim();
        const newCourier = courierInput.value.trim();

        if (newStatus === 'Shipped' && (!newTracking || !newCourier)) {
            alert('Please enter Tracking ID and Courier Company for shipped orders.');
            return;
        }

        orders[editingIndex].status = newStatus;
        orders[editingIndex].trackingId = newStatus === 'Shipped' ? newTracking : '';
        orders[editingIndex].courier = newStatus === 'Shipped' ? newCourier : '';

        // Here you will update the Firebase DB as well (add in orders.js)

        renderOrders();
        closeModal();
    });

    // Close modal and overlay
    function closeModal() {
        statusModal.style.display = 'none';
        overlay.style.display = 'none';
        editingIndex = null;
    }

    overlay.addEventListener('click', closeModal);

    // This function should be called from your Firebase data fetch logic in orders.js like this:
    // function updateOrdersFromFirebase(data) {
    //    orders = data;
    //    renderOrders();
    // }