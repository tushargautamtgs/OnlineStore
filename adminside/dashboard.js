import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, push, set, get, child, goOnline, update, remove } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDIlrryL5ULRxK3YV9KXaiYevb34SZgP-Y",
    authDomain: "resinecomsite-b81db.firebaseapp.com",
    databaseURL: "https://resinecomsite-b81db-default-rtdb.firebaseio.com",
    projectId: "resinecomsite-b81db",
    storageBucket: "resinecomsite-b81db.appspot.com",
    messagingSenderId: "161078498565",
    appId: "1:161078498565:web:5df7e6039fbd5d89d1f525"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
goOnline(db);

function showLoader() {
  document.getElementById("loaderOverlay").style.display = "flex";
}
function hideLoader() {
  document.getElementById("loaderOverlay").style.display = "none";
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}


window.addCategory = function () {
    const categoryName = document.getElementById('categoryName').value.trim();
    if (!categoryName) return alert('Enter category name');

    const categoryRef = ref(db, 'categories');
    const newCategoryRef = push(categoryRef);
    set(newCategoryRef, {
        name: categoryName,
        createdAt: new Date().toISOString()
    }).then(() => {
        alert('Category added!');
        document.getElementById('categoryName').value = '';
        loadCategories();
    }).catch(err => alert('Error: ' + err.message));
};

function loadCategories() {
    const dropdown = document.getElementById('categoryDropdown');
    dropdown.innerHTML = '<option value="">Select Category</option>';

    get(ref(db, 'categories')).then(snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
                const option = document.createElement('option');
                option.value = data[key].name;
                option.textContent = data[key].name;
                dropdown.appendChild(option);
            });
        }
    }).catch(err => console.error('Load Category Error:', err));
}
loadCategories();

window.uploadProduct = function () {
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const category = document.getElementById('categoryDropdown').value;
    const file = document.getElementById('productImage').files[0];

    if (!name || !price || !stock || !category || !file) {
        return showToast('⚠️ Fill all product fields');
    }

    showLoader(); // loader start

    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', '2dab2fe9bfd405da35d910f8142b4329');

    fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        const imageUrl = data.data.url;
        const productRef = push(ref(db, 'products'));
        return set(productRef, {
            name, price, stock, category, imageUrl,
            createdAt: new Date().toISOString()
        });
    })
    .then(() => {
        hideLoader(); // loader stop
        showToast('✅ Product listed successfully');
        // clear form
        document.getElementById('productName').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productStock').value = '';
        document.getElementById('categoryDropdown').value = '';
        document.getElementById('productImage').value = '';
    })
    .catch(err => {
        hideLoader();
        showToast('❌ Upload Error: ' + err.message);
    });
};

window.fetchProducts = function () {
    const productListContainer = document.getElementById('productListContainer');
    productListContainer.innerHTML = 'Loading...';

    get(ref(db, 'products')).then(snapshot => {
        productListContainer.innerHTML = '';
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
                const prod = data[key];
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <img src="${prod.imageUrl}" alt="${prod.name}" />
                    <div class="product-info">
                        <h4>${prod.name}</h4>
                        <p>₹${prod.price}</p>
                        <p>Stock: ${prod.stock}</p>
                        <p>Category: ${prod.category}</p>
                        <div class="button-group">
                          <button class="edit-btn" onclick="openEditModal('${key}', ${JSON.stringify(prod).replace(/"/g, '&quot;')})">Edit</button>
                          <button class="delete-btn" onclick="deleteProduct('${key}')">Delete</button>
                        </div>
                    </div>
                `;
                productListContainer.appendChild(card);
            });
        } else {
            productListContainer.innerHTML = '<p>No products found.</p>';
        }
    }).catch(err => {
        console.error('Fetch Error:', err);
        productListContainer.innerHTML = '<p>Error loading products.</p>';
    });
};


let currentEditProductId = '';
let currentEditProductData = {};

window.openEditModal = function(key, product) {
    currentEditProductId = key;
    currentEditProductData = product;

    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductStock').value = product.stock;

    const dropdown = document.getElementById('editCategoryDropdown');
    dropdown.innerHTML = `<option value="${product.category}">${product.category}</option>`;

    get(ref(db, 'categories')).then(snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
                if (data[key].name !== product.category) {
                    const option = document.createElement('option');
                    option.value = data[key].name;
                    option.textContent = data[key].name;
                    dropdown.appendChild(option);
                }
            });
        }
    });

    document.getElementById('editModal').style.display = 'flex';
};

window.closeEditModal = function() {
    document.getElementById('editModal').style.display = 'none';
};

window.saveEditedProduct = function() {
    const updatedProduct = {
        name: document.getElementById('editProductName').value.trim(),
        price: parseFloat(document.getElementById('editProductPrice').value),
        stock: parseInt(document.getElementById('editProductStock').value),
        category: document.getElementById('editCategoryDropdown').value,
        imageUrl: currentEditProductData.imageUrl,
        createdAt: currentEditProductData.createdAt
    };

    update(ref(db, 'products/' + currentEditProductId), updatedProduct)
        .then(() => {
            alert('Product updated!');
            closeEditModal();
            fetchProducts();
        })
        .catch(err => alert('Update Error: ' + err.message));
};

window.deleteProduct = function(key) {
    if (!confirm('Delete this product?')) return;
    remove(ref(db, 'products/' + key))
        .then(() => {
            alert('Product deleted!');
            fetchProducts();
        })
        .catch(err => alert('Delete Error: ' + err.message));
};
window.logout = function () {
    alert("Logged out successfully!");
    window.location.href = "index.html"; // Change if needed
};
// Toggle category list visibility
window.toggleCategoryList = function() {
    const list = document.getElementById('categoryList');
    list.style.display = list.style.display === 'none' ? 'block' : 'none';
    if(list.style.display === 'block') loadAllCategories();
}

// Load categories from Firebase and show in list with delete option
function loadAllCategories() {
    const listContainer = document.getElementById('categoryList');
    listContainer.innerHTML = 'Loading...';

    get(ref(db, 'categories')).then(snapshot => {
        listContainer.innerHTML = '';
        if(snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
                const cat = data[key];
                const div = document.createElement('div');
                div.className = 'category-item';
                div.style.display = 'flex';
                div.style.justifyContent = 'space-between';
                div.style.alignItems = 'center';
                div.style.padding = '0.5rem 0';
                div.innerHTML = `
                    <span>${cat.name}</span>
                    <button onclick="deleteCategory('${key}')"
                        style="background:#ff4d4d;color:#fff;border:none;padding:0.3rem 0.8rem;border-radius:5px;cursor:pointer;">
                        Delete
                    </button>
                `;
                listContainer.appendChild(div);
            });
        } else {
            listContainer.innerHTML = '<p style="color:#555;">No categories found.</p>';
        }
    }).catch(err => {
        listContainer.innerHTML = '<p style="color:red;">Error loading categories.</p>';
        console.error(err);
    });
}

// Delete category from Firebase
window.deleteCategory = function(key) {
    if(!confirm("Delete this category?")) return;
    remove(ref(db, 'categories/' + key))
        .then(() => {
            alert('Category deleted!');
            loadAllCategories(); // refresh list
            loadCategories(); // refresh dropdowns
        })
        .catch(err => alert('Delete Error: ' + err.message));
};
