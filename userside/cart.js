      // firebase configs

      const firebaseConfig = {
        apiKey: "AIzaSyA0StbmF9z2kK4WMEOpG9qO9XwlAfd",
        authDomain: "ecommerce-492b2.firebaseapp.com",
        databaseURL: "https://resinecomsite-b81db-default-rtdb.firebaseio.com/",
        projectId: "ecommerce-492b2",
        storageBucket: "ecommerce-492b2.appspot.com",
        messagingSenderId: "973139470429",
        appId: "1:973139470429:web:0c1915e57edfd72e6b0cb1",
      };

      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      const db = firebase.database();

      let cartItems = JSON.parse(localStorage.getItem("cart")) || [];
      let currentCustomizeIndex = null;

      function renderCart() {
        const cartContainer = document.getElementById("cart-items");
        cartContainer.innerHTML = "";
        cartItems.forEach((item, index) => {
          cartContainer.innerHTML += `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
              <h4>${item.name}</h4>
              <p>RS ${item.price.toFixed(2)}</p>
              <select class="quantity-select" onchange="updateQuantity(${index}, this.value)">
                ${[...Array(10)]
                  .map(
                    (_, i) =>
                      `<option value="${i + 1}" ${
                        item.quantity === i + 1 ? "selected" : ""
                      }>${i + 1}</option>`
                  )
                  .join("")}
              </select>
              ${
                item.customization
                  ? `<p><em>Customization:</em> ${item.customization}</p>`
                  : ""
              }
            </div>
            <div class="btn-group">
              <button class="customize-btn" onclick="openModal(${index})">Customize</button>
              <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
            </div>
          </div>`;
        });
        updateSubtotal();
      }

      function updateQuantity(index, value) {
        cartItems[index].quantity = parseInt(value);
        localStorage.setItem("cart", JSON.stringify(cartItems));
        renderCart();
      }

      function removeItem(index) {
        cartItems.splice(index, 1);
        localStorage.setItem("cart", JSON.stringify(cartItems));
        renderCart();
      }

      function updateSubtotal() {
        let subtotal = 0;
        cartItems.forEach((item) => {
          subtotal += item.price * item.quantity;
        });
        document.getElementById("subtotal").innerText =
          "Subtotal: RS " + subtotal.toFixed(2);
      }

      function openModal(index) {
        currentCustomizeIndex = index;
        document.getElementById("customText").value =
          cartItems[index]?.customization || "";
        document.getElementById("customizeModal").style.display = "flex";
      }

      function closeModal() {
        document.getElementById("customizeModal").style.display = "none";
        currentCustomizeIndex = null;
      }

      function saveCustomization() {
        const customText = document.getElementById("customText").value;
        if (
          currentCustomizeIndex !== null &&
          cartItems[currentCustomizeIndex]
        ) {
          cartItems[currentCustomizeIndex].customization = customText;
          localStorage.setItem("cart", JSON.stringify(cartItems));
          closeModal();
          renderCart();
        }
      }

      function applyPromo() {
        const promo = document.getElementById("promoInput").value;
        if (promo) {
          alert("Promocode applied: " + promo);
        }
      }

      document
        .querySelector(".place-order-btn")
        .addEventListener("click", () => {
          document.getElementById("orderModal").style.display = "flex";
        });

      function closeOrderModal() {
        document.getElementById("orderModal").style.display = "none";
      }

      function submitOrder() {
        const name = document.getElementById("orderName").value.trim();
        const phone = document.getElementById("orderPhone").value.trim();
        const address = document.getElementById("orderAddress").value.trim();
        const landmark = document.getElementById("orderLandmark").value.trim();
        const email = document.getElementById("orderEmail").value.trim();

        const orderItems = cartItems.map((item) => ({
          id: item.id || "no-id", // ✅ fallback de diya
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          customization: item.customization || "None",
        }));

        const totalAmount = orderItems.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
        const timestamp = new Date().toISOString();
        const orderId = `ORD-${Date.now()}`;

        if (!name || !phone || !address || orderItems.length === 0) {
          alert("Please fill all required fields and add at least one item.");
          return;
        }

        const orderData = {
          customer: {
            name,
            phone,
            address,
            landmark,
            email,
          },
          items: orderItems,
          orderId,
          timestamp,
          totalAmount,
        };

        db.ref("orders/" + orderId)
          .set(orderData)
          .then(() => {
            <!--          alert("🎉 Order placed successfully!");-->
            showToast("🎉 Order placed successfully!");

            closeOrderModal();
            localStorage.removeItem("cart");
            cartItems = [];
            renderCart();
          })
          .catch((error) => {
            console.error("Error saving order:", error);
            alert("❌ Failed to place order.");
          });
      }

      function showToast(message) {
        const toast = document.createElement("div");
        toast.className = "custom-toast";
        toast.innerText = message;

        document.body.appendChild(toast);

        setTimeout(() => {
          toast.remove();
        }, 3000); // Toast will auto remove after 3s
      }
      renderCart();