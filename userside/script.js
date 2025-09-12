document.addEventListener('DOMContentLoaded', () => {
    const categoryButtons = document.getElementById("categoryButtons");
    const productGrid = document.getElementById("productGrid");
    const cartCountEl = document.getElementById("cart-count");
    const loader = document.getElementById('loader');

    let allProducts = [];
    let toastTimeout;

    // Firebase config (abbreviated for brevity)
    const firebaseConfig = {
        apiKey: "AIzaSyAxblilB8...",
        authDomain: "resinecomsite-b81db.firebaseapp.com",
        databaseURL: "https://resinecomsite-b81db-default-rtdb.firebaseio.com",
        projectId: "resinecomsite-b81db",
        storageBucket: "resinecomsite-b81db.firebasestorage.app",
        messagingSenderId: "218978469921",
        appId: "1:218978469921:web:c6c7f790b1d869442a7b60"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    loader.style.display = 'flex';

    // Fetch and display categories
    db.ref("categories").once("value").then(snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.values(data).forEach(cat => {
                const btn = document.createElement("button");
                btn.className = "cat-btn";
                btn.dataset.category = cat.name;
                btn.innerText = cat.name;
                categoryButtons.appendChild(btn);
            });
        }
    });

    // Fetch products from Firebase then display
    async function fetchProducts() {
        try {
            const snapshot = await db.ref("products").once("value");
            if (snapshot.exists()) {
                allProducts = Object.keys(snapshot.val()).map(key => ({ key, ...snapshot.val()[key] }));
                displayProducts(allProducts);
            } else {
                productGrid.innerHTML = "<p>No products found.</p>";
            }
        } catch (err) {
            console.error("Error fetching products:", err);
        }
        loader.style.display = 'none';
    }

    function displayProducts(products) {
        productGrid.innerHTML = "";
        products.forEach(prod => {
            const card = document.createElement("div");
            card.className = "product-card";
            card.innerHTML = `
                <img src="${prod.imageUrl}" alt="${prod.name}" />
                <h3>${prod.name}</h3>
                <p>₹${prod.price}</p>
                <button class="cart-btn" onclick="addToCart('${prod.key}', '${prod.name}', ${prod.price}, '${prod.imageUrl}')">🛒 Add to Cart</button>
            `;
            productGrid.appendChild(card);
        });
    }

    // Toast show function with fade effect
    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;

        // Reset toast to trigger animation
        toast.classList.remove('show');
        void toast.offsetWidth;  // Trigger reflow
        toast.classList.add('show');

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Add to Cart function - window scope so it can be used in inline onclick
    window.addToCart = function(key, name, price, image) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item.key === key);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ key, name, price, image, quantity: 1 });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();

        showToast(`🛒 ${name} added to cart`);
    };

    // Update cart counter badge
    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const uniqueProductCount = cart.length;

        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            cartCountEl.textContent = uniqueProductCount;
            cartCountEl.style.display = uniqueProductCount > 0 ? 'inline-block' : 'none';
        }
    }

    // Category filter buttons event
    categoryButtons.addEventListener("click", (e) => {
        if (e.target.classList.contains("cat-btn")) {
            const selectedCategory = e.target.dataset.category;
            document.querySelectorAll(".cat-btn").forEach(btn => btn.classList.remove("active"));
            e.target.classList.add("active");

            if (selectedCategory === "all") {
                displayProducts(allProducts);
            } else {
                displayProducts(allProducts.filter(p => p.category === selectedCategory));
            }
        }
    });

    fetchProducts();
    updateCartCount();
});

    // Show cart count on load
    document.addEventListener('DOMContentLoaded', function () {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        const countEl = document.getElementById('cart-count');
        if (countEl) {
            countEl.textContent = count;
            if (count > 0) {
                countEl.style.display = 'inline-block';
            } else {
                countEl.style.display = 'none';
            }
        }
    });
function toggleMenu() {
  const nav = document.querySelector('.nav-links');
  const hamburger = document.querySelector('.hamburger');
  nav.classList.toggle('active');
  hamburger.classList.toggle('active');
}
