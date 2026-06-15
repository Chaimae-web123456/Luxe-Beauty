let products = JSON.parse(localStorage.getItem("products")) || [
  {
    id: 1,
    name: "Coffret Rituals Sakura",
    price: 450,
    image: "https://via.placeholder.com/300x300.png?text=Rituals",
    type: "stock",
    stock: 2
  },
  {
    id: 2,
    name: "Brume Victoria's Secret",
    price: 250,
    image: "https://via.placeholder.com/300x300.png?text=Victoria+Secret",
    type: "commande",
    stock: 0
  }
];

let cart = JSON.parse(localStorage.getItem("cart")) || [];

let giftOffer = JSON.parse(localStorage.getItem("giftOffer")) || {
  name: "Mini cadeau surprise",
  limit: 500
};

function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function displayProducts(filter = "all") {
  const container = document.getElementById("products");
  container.innerHTML = "";

  const filtered = filter === "all"
    ? products
    : products.filter(p => p.type === filter);

  filtered.forEach(product => {
    container.innerHTML += `
      <div class="product">
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.price} DH</p>
        <span class="badge">${product.type === "stock" ? "En stock Maroc" : "Sur commande"}</span>
        <p>Stock : ${product.stock}</p>
        <button onclick="addToCart(${product.id})">Ajouter au panier</button>
      </div>
    `;
  });
}

function filterProducts(type) {
  displayProducts(type);
}

function addToCart(id) {
  const product = products.find(p => p.id === id);

  if (product.type === "stock" && product.stock <= 0) {
    alert("Produit en rupture de stock.");
    return;
  }

  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  displayCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  displayCart();
}

function displayCart() {
  const cartContainer = document.getElementById("cart");
  const totalElement = document.getElementById("total");
  const giftElement = document.getElementById("gift");

  cartContainer.innerHTML = "";

  let total = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;

    cartContainer.innerHTML += `
      <div class="cart-item">
        <strong>${item.name}</strong><br>
        ${item.price} DH x ${item.quantity}
        <button onclick="removeFromCart(${item.id})">Supprimer</button>
      </div>
    `;
  });

  totalElement.textContent = total;

  if (total >= giftOffer.limit) {
    giftElement.innerHTML = `🎁 Cadeau offert : <strong>${giftOffer.name}</strong>`;
  } else {
    giftElement.innerHTML = `Encore ${giftOffer.limit - total} DH pour avoir le cadeau : ${giftOffer.name}`;
  }
}

function sendWhatsAppOrder() {
  if (cart.length === 0) {
    alert("Ton panier est vide.");
    return;
  }

  let total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let message = "Bonjour, je souhaite commander :%0A%0A";

  cart.forEach(item => {
    message += `- ${item.name} x${item.quantity} : ${item.price * item.quantity} DH%0A`;
  });

  message += `%0ATotal : ${total} DH%0A`;

  if (total >= giftOffer.limit) {
    message += `Cadeau offert : ${giftOffer.name}%0A`;
  }

  message += `%0ANom : %0AVille : %0ATéléphone :`;

  window.open(`https://wa.me/212625937101?text=${message}`, "_blank");
}

let selectedImage = "";

function previewImage(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    selectedImage = e.target.result;

    const preview = document.getElementById("imagePreview");
    preview.src = selectedImage;
    preview.classList.remove("hidden");
  };

  reader.readAsDataURL(file);
}

function loginAdmin() {
  const password = document.getElementById("adminPassword").value;

  if (password === "admin123") {
    document.getElementById("adminPanel").classList.remove("hidden");
    displayAdminProducts();
  } else {
    alert("Mot de passe incorrect.");
  }
}

function saveProduct() {
  const productId = document.getElementById("productId").value;
  const name = document.getElementById("name").value;
  const price = Number(document.getElementById("price").value);
  const type = document.getElementById("type").value;
  const stock = Number(document.getElementById("stock").value);

  if (!name || !price) {
    alert("Remplis le nom et le prix.");
    return;
  }

  if (!productId && !selectedImage) {
    alert("Choisis une image.");
    return;
  }

  if (productId) {
    const product = products.find(p => p.id == productId);

    product.name = name;
    product.price = price;
    product.type = type;
    product.stock = stock;

    if (selectedImage) {
      product.image = selectedImage;
    }
  } else {
    products.push({
      id: Date.now(),
      name,
      price,
      image: selectedImage,
      type,
      stock
    });
  }

  saveProducts();
  displayProducts();
  displayAdminProducts();
  resetForm();
}

function editProduct(id) {
  const product = products.find(p => p.id === id);

  document.getElementById("productId").value = product.id;
  document.getElementById("name").value = product.name;
  document.getElementById("price").value = product.price;
  document.getElementById("type").value = product.type;
  document.getElementById("stock").value = product.stock;

  selectedImage = "";

  const preview = document.getElementById("imagePreview");
  preview.src = product.image;
  preview.classList.remove("hidden");
}

function deleteProduct(id) {
  products = products.filter(p => p.id !== id);
  saveProducts();
  displayProducts();
  displayAdminProducts();
}

function resetForm() {
  document.getElementById("productId").value = "";
  document.getElementById("name").value = "";
  document.getElementById("price").value = "";
  document.getElementById("imageFile").value = "";
  document.getElementById("type").value = "stock";
  document.getElementById("stock").value = "";

  selectedImage = "";

  const preview = document.getElementById("imagePreview");
  preview.src = "";
  preview.classList.add("hidden");
}

function displayAdminProducts() {
  const container = document.getElementById("adminProducts");
  container.innerHTML = "";

  products.forEach(product => {
    container.innerHTML += `
      <div class="cart-item">
        <img src="${product.image}" width="60" style="border-radius:10px;">
        <strong>${product.name}</strong> - ${product.price} DH
        <button onclick="editProduct(${product.id})">Modifier</button>
        <button onclick="deleteProduct(${product.id})">Supprimer</button>
      </div>
    `;
  });
}
function saveGift() {
  const giftName = document.getElementById("giftName").value;
  const giftLimit = Number(document.getElementById("giftLimit").value);

  if (!giftName || !giftLimit) {
    alert("Remplis le nom du cadeau et le montant minimum.");
    return;
  }

  giftOffer = {
    name: giftName,
    limit: giftLimit
  };

  localStorage.setItem("giftOffer", JSON.stringify(giftOffer));

  displayCart();

  alert("Offre cadeau sauvegardée.");
}
document.getElementById("pasteZone").addEventListener("paste", function (event) {

    const items = event.clipboardData.items;

    for (let i = 0; i < items.length; i++) {

        if (items[i].type.indexOf("image") !== -1) {

            const file = items[i].getAsFile();

            const reader = new FileReader();

            reader.onload = function(e) {

                selectedImage = e.target.result;

                const preview = document.getElementById("imagePreview");

                preview.src = selectedImage;
                preview.classList.remove("hidden");
            };

            reader.readAsDataURL(file);

            break;
        }
    }
});

displayProducts();
displayCart();