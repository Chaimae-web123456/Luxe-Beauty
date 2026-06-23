const SUPABASE_URL = "https://uuqhmasinqzfqteuakew.supabase.co";
const SUPABASE_KEY = "sb_publishable_3nQIfvrzixgC3-tPg0P7eA_G_V-DamN";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const WHATSAPP_NUMBER = "212625937101";
const ADMIN_PASSWORD = "admin123";

const CATEGORIES = [
  "Parfums",
  "Coffrets corps",
  "Coffrets parfums",
  "Brumes",
  "Soins corps",
  "Soins cheveux",
  "Maquillage",
  "Accessoires"
];

let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

let giftOffer = {
  name: "Mini cadeau surprise",
  limit: 500
};

let selectedImage = "";
let selectedVariantImage = "";
let currentVariants = [];
let selectedProduct = null;
let currentCategoryFilter = "all";
let editingVariantIndex = null;

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function toggleMenu() {
  document.getElementById("sideMenu").classList.toggle("open");
}

function toggleCart() {
  document.getElementById("cartPanel").classList.toggle("open");
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
  document.getElementById("sideMenu").classList.remove("open");
}

async function loadProductsFromSupabase() {
  const { data, error } = await supabaseClient
    .from("products")
    .select(`
      id,
      name,
      description,
      category,
      type,
      created_at,
      variants (
        id,
        variant_name,
        price,
        old_price,
        stock,
        image_url
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur chargement produits :", error);
    alert("Erreur chargement produits.");
    return;
  }

  products = (data || []).map(product => ({
    id: product.id,
    name: product.name,
    description: product.description || "",
    category: product.category || "Parfums",
    type: product.type || "stock",
    image: product.variants?.[0]?.image_url || "",
    variants: (product.variants || []).map(variant => ({
      id: variant.id,
      name: variant.variant_name,
      price: Number(variant.price),
      oldPrice: Number(variant.old_price) || 0,
      stock: Number(variant.stock) || 0,
      image: variant.image_url || ""
    }))
  }));

  displayProducts();
  displayAdminProducts();
}

async function loadGiftFromSupabase() {
  const { data, error } = await supabaseClient
    .from("gifts")
    .select("*")
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Erreur cadeau :", error);
    return;
  }

  if (data && data.length > 0) {
    giftOffer = {
      name: data[0].name,
      limit: Number(data[0].minimum_amount)
    };
  }

  displayCart();
}

function getProductMainImage(product) {
  return product.image || product.variants?.[0]?.image || "https://via.placeholder.com/300x300.png?text=Produit";
}

function getMinPrice(product) {
  if (!product.variants || product.variants.length === 0) return 0;
  return Math.min(...product.variants.map(v => Number(v.price)));
}

function hasPromotion(product) {
  return product.variants?.some(v => Number(v.oldPrice) > Number(v.price));
}

function renderProductCard(product) {
  return `
    <div class="product" onclick="openProductModal(${product.id})">
      <img src="${getProductMainImage(product)}" alt="${product.name}">
      <div class="product-content">
        <h3>${product.name}</h3>
        <p>À partir de ${getMinPrice(product)} DH</p>
        <span class="badge">${product.type === "stock" ? "En stock Maroc" : "Sur commande"}</span>
        ${hasPromotion(product) ? `<span class="badge promo">Promo</span>` : ""}
      </div>
    </div>
  `;
}

function displayProducts() {
  displayCategoryBlocks();
  displayHomeProducts();
  displayAllProducts();
  displayProductList("stock", "stockProducts");
  displayProductList("commande", "commandeProducts");
  displayPromoProducts();
}

function displayCategoryBlocks() {
  const container = document.getElementById("categoryBlocks");
  if (!container) return;

  container.innerHTML = "";

  CATEGORIES.forEach(category => {
    container.innerHTML += `<div onclick="openCategory('${category}')">${category}</div>`;
  });
}

function openCategory(category) {
  currentCategoryFilter = category;
  showPage("allProducts");
  displayAllProducts();
}

function setCategoryFilter(category) {
  currentCategoryFilter = category;
  displayAllProducts();
}

function displayHomeProducts() {
  const container = document.getElementById("homeProducts");
  if (!container) return;

  container.innerHTML = products.length
    ? products.map(renderProductCard).join("")
    : "<p>Aucun produit pour le moment.</p>";
}

function displayAllProducts() {
  const container = document.getElementById("allProductsList");
  if (!container) return;

  const search = (document.getElementById("searchInput")?.value || "").toLowerCase();

  const filtered = products.filter(product => {
    return (
      (currentCategoryFilter === "all" || product.category === currentCategoryFilter) &&
      (
        product.name.toLowerCase().includes(search) ||
        (product.description || "").toLowerCase().includes(search) ||
        (product.category || "").toLowerCase().includes(search)
      )
    );
  });

  container.innerHTML = filtered.length
    ? filtered.map(renderProductCard).join("")
    : "<p>Aucun produit trouvé.</p>";
}

function displayProductList(type, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const filtered = products.filter(product => product.type === type);

  container.innerHTML = filtered.length
    ? filtered.map(renderProductCard).join("")
    : "<p>Aucun produit pour le moment.</p>";
}

function displayPromoProducts() {
  const container = document.getElementById("promoProducts");
  if (!container) return;

  const promos = products.filter(hasPromotion);

  container.innerHTML = promos.length
    ? promos.map(renderProductCard).join("")
    : "<p>Aucune promotion pour le moment.</p>";
}

function openProductModal(id) {
  selectedProduct = products.find(product => product.id === id);
  if (!selectedProduct) return;

  const firstVariant = selectedProduct.variants[0];

  document.getElementById("modalImage").src = firstVariant?.image || getProductMainImage(selectedProduct);
  document.getElementById("modalName").textContent = selectedProduct.name;
  document.getElementById("modalDescription").textContent = selectedProduct.description || "";
  document.getElementById("modalCategory").textContent = `Catégorie : ${selectedProduct.category}`;

  const select = document.getElementById("modalVariant");
  select.innerHTML = "";

  selectedProduct.variants.forEach((variant, index) => {
    select.innerHTML += `
      <option value="${index}">
        ${variant.name} - ${variant.price} DH
      </option>
    `;
  });

  select.onchange = updateModalPrice;
  updateModalPrice();

  document.getElementById("productModal").classList.remove("hidden");
}
function updateModalPrice() {
  if (!selectedProduct) return;

  const index = Number(document.getElementById("modalVariant").value);
  const variant = selectedProduct.variants[index];

  document.getElementById("modalPrice").textContent = variant.price;
  document.getElementById("modalImage").src = variant.image || getProductMainImage(selectedProduct);

  document.getElementById("modalOldPrice").textContent =
    Number(variant.oldPrice) > Number(variant.price)
      ? `${variant.oldPrice} DH`
      : "";
}

function closeProductModal() {
  document.getElementById("productModal").classList.add("hidden");
}

function addSelectedVariantToCart() {
  const index = Number(document.getElementById("modalVariant").value);
  const variant = selectedProduct.variants[index];

  if (selectedProduct.type === "stock" && Number(variant.stock) <= 0) {
    alert("Cette variante est en rupture de stock.");
    return;
  }

  const cartId = `${selectedProduct.id}-${variant.name}`;
  const existing = cart.find(item => item.cartId === cartId);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      cartId,
      productId: selectedProduct.id,
      name: selectedProduct.name,
      variant: variant.name,
      price: Number(variant.price),
      image: variant.image || getProductMainImage(selectedProduct),
      quantity: 1
    });
  }

  saveCart();
  displayCart();
  closeProductModal();
  document.getElementById("cartPanel").classList.add("open");
}

function removeFromCart(cartId) {
  cart = cart.filter(item => item.cartId !== cartId);
  saveCart();
  displayCart();
}

function changeQuantity(cartId, change) {
  const item = cart.find(item => item.cartId === cartId);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    removeFromCart(cartId);
    return;
  }

  saveCart();
  displayCart();
}

function displayCart() {
  const cartContainer = document.getElementById("cart");
  const totalElement = document.getElementById("total");
  const giftElement = document.getElementById("gift");
  const cartCount = document.getElementById("cartCount");

  cartContainer.innerHTML = "";

  let total = 0;
  let count = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;
    count += item.quantity;

    cartContainer.innerHTML += `
      <div class="cart-item">
        <img src="${item.image}" width="45" style="border-radius:8px;"><br>
        <strong>${item.name}</strong><br>
        Variante : ${item.variant}<br>
        ${item.price} DH x ${item.quantity}<br>
        <button onclick="changeQuantity('${item.cartId}', -1)">-</button>
        <button onclick="changeQuantity('${item.cartId}', 1)">+</button>
        <button onclick="removeFromCart('${item.cartId}')">Supprimer</button>
      </div>
    `;
  });

  totalElement.textContent = total;
  cartCount.textContent = count;

  if (cart.length === 0) {
    giftElement.innerHTML = "";
  } else if (total >= giftOffer.limit) {
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

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let message = "Bonjour, je souhaite commander :\n\n";

  cart.forEach(item => {
    message += `- ${item.name} (${item.variant}) x${item.quantity} : ${item.price * item.quantity} DH\n`;
  });

  message += `\nTotal : ${total} DH\n`;

  if (total >= giftOffer.limit) {
    message += `Cadeau offert : ${giftOffer.name}\n`;
  }

  message += "\nNom :\nVille :\nTéléphone :";

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
}

function sendCustomRequest() {
  const productName = document.getElementById("customName").value;
  const customMessage = document.getElementById("customMessage").value;

  const message = `Bonjour, je cherche un produit qui n'est pas sur le site.\n\nProduit : ${productName}\nDétails : ${customMessage}`;

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
}

async function uploadBase64Image(base64Image) {
  if (!base64Image) return "";

  const response = await fetch(base64Image);
  const blob = await response.blob();

  const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(2)}.png`;

  const { error } = await supabaseClient.storage
    .from("products")
    .upload(fileName, blob, {
      contentType: "image/png",
      upsert: true
    });

  if (error) {
    console.error("Erreur upload image :", error);
    alert("Erreur upload image.");
    return "";
  }

  const { data } = supabaseClient.storage
    .from("products")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

function setSelectedImageFromClipboard(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    selectedImage = e.target.result;
    document.getElementById("imagePreview").src = selectedImage;
    document.getElementById("imagePreview").classList.remove("hidden");
  };

  reader.readAsDataURL(file);
}

function setSelectedVariantImageFromClipboard(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    selectedVariantImage = e.target.result;
    document.getElementById("variantImagePreview").src = selectedVariantImage;
    document.getElementById("variantImagePreview").classList.remove("hidden");
  };

  reader.readAsDataURL(file);
}

function setupPasteImage() {
  const pasteZone = document.getElementById("pasteZone");
  if (!pasteZone) return;

  pasteZone.addEventListener("paste", function(event) {
    for (const item of event.clipboardData.items) {
      if (item.type.includes("image")) {
        setSelectedImageFromClipboard(item.getAsFile());
      }
    }
  });
}

function setupVariantPasteImage() {
  const pasteZone = document.getElementById("variantPasteZone");
  if (!pasteZone) return;

  pasteZone.addEventListener("paste", function(event) {
    for (const item of event.clipboardData.items) {
      if (item.type.includes("image")) {
        setSelectedVariantImageFromClipboard(item.getAsFile());
      }
    }
  });
}

function loginAdmin() {
  const password = document.getElementById("adminPassword").value;

  if (password === ADMIN_PASSWORD) {
    document.getElementById("adminPanel").classList.remove("hidden");
    displayAdminProducts();
  } else {
    alert("Mot de passe incorrect.");
  }
}

function addVariant() {
  const name = document.getElementById("variantName").value.trim();
  const price = Number(document.getElementById("variantPrice").value);
  const oldPrice = Number(document.getElementById("variantOldPrice").value) || 0;
  const stock = Number(document.getElementById("variantStock").value) || 0;

  if (!name || !price) {
    alert("Remplis la variante et le prix.");
    return;
  }

  const variantData = {
    name,
    price,
    oldPrice,
    stock,
    image: selectedVariantImage || ""
  };

  if (editingVariantIndex !== null) {
    currentVariants[editingVariantIndex] = variantData;
  } else {
    currentVariants.push(variantData);
  }

  clearVariantForm();
  displayVariants();
}

function clearVariantForm() {
  document.getElementById("variantName").value = "";
  document.getElementById("variantPrice").value = "";
  document.getElementById("variantOldPrice").value = "";
  document.getElementById("variantStock").value = "";
  document.getElementById("variantPasteZone").value = "";

  selectedVariantImage = "";
  editingVariantIndex = null;

  document.getElementById("variantImagePreview").src = "";
  document.getElementById("variantImagePreview").classList.add("hidden");

  document.getElementById("variantButton").textContent = "Ajouter variante";
}

function displayVariants() {
  const container = document.getElementById("variantsList");
  container.innerHTML = "";

  currentVariants.forEach((variant, index) => {
    container.innerHTML += `
      <div>
        ${variant.image ? `<img src="${variant.image}" width="50" style="border-radius:8px;">` : ""}
        ${variant.name} - ${variant.price} DH - Stock : ${variant.stock}
        ${variant.oldPrice > variant.price ? ` - Ancien prix : ${variant.oldPrice} DH` : ""}
        <button onclick="editVariant(${index})">Modifier</button>
        <button onclick="deleteVariant(${index})">Supprimer</button>
      </div>
    `;
  });
}

function editVariant(index) {
  const variant = currentVariants[index];

  document.getElementById("variantName").value = variant.name;
  document.getElementById("variantPrice").value = variant.price;
  document.getElementById("variantOldPrice").value = variant.oldPrice || "";
  document.getElementById("variantStock").value = variant.stock;

  selectedVariantImage = variant.image || "";
  editingVariantIndex = index;

  if (selectedVariantImage) {
    document.getElementById("variantImagePreview").src = selectedVariantImage;
    document.getElementById("variantImagePreview").classList.remove("hidden");
  } else {
    document.getElementById("variantImagePreview").src = "";
    document.getElementById("variantImagePreview").classList.add("hidden");
  }

  document.getElementById("variantButton").textContent = "Modifier variante";
}

function deleteVariant(index) {
  currentVariants.splice(index, 1);
  clearVariantForm();
  displayVariants();
}

async function saveProduct() {
  const productId = document.getElementById("productId").value;
  const name = document.getElementById("name").value.trim();
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value;
  const type = document.getElementById("type").value;

  if (!name) {
    alert("Remplis le nom du produit.");
    return;
  }

  if (currentVariants.length === 0) {
    alert("Ajoute au moins une variante.");
    return;
  }

  let productImageUrl = selectedImage && selectedImage.startsWith("data:")
    ? await uploadBase64Image(selectedImage)
    : selectedImage;

  let savedProductId = productId;

  if (productId) {
    const { error } = await supabaseClient
      .from("products")
      .update({
        name,
        description,
        category,
        type
      })
      .eq("id", productId);

    if (error) {
      console.error(error);
      alert("Erreur modification produit.");
      return;
    }

    await supabaseClient.from("variants").delete().eq("product_id", productId);
  } else {
    const { data, error } = await supabaseClient
      .from("products")
      .insert({
        name,
        description,
        category,
        type
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Erreur ajout produit.");
      return;
    }

    savedProductId = data.id;
  }

  for (const variant of currentVariants) {
    let imageUrl = variant.image;

    if (imageUrl && imageUrl.startsWith("data:")) {
      imageUrl = await uploadBase64Image(imageUrl);
    }

    if (!imageUrl && productImageUrl) {
      imageUrl = productImageUrl;
    }

    const { error } = await supabaseClient
      .from("variants")
      .insert({
        product_id: savedProductId,
        variant_name: variant.name,
        price: variant.price,
        old_price: variant.oldPrice,
        stock: variant.stock,
        image_url: imageUrl || ""
      });

    if (error) {
      console.error(error);
      alert("Erreur ajout variante.");
      return;
    }
  }

  await loadProductsFromSupabase();
  resetForm();
  alert("Produit sauvegardé dans Supabase.");
}

function editProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  document.getElementById("productId").value = product.id;
  document.getElementById("name").value = product.name;
  document.getElementById("description").value = product.description || "";
  document.getElementById("category").value = product.category || "Parfums";
  document.getElementById("type").value = product.type;

  currentVariants = product.variants.map(v => ({ ...v }));
  selectedImage = product.image || "";
  selectedVariantImage = "";
  editingVariantIndex = null;

  if (selectedImage) {
    document.getElementById("imagePreview").src = selectedImage;
    document.getElementById("imagePreview").classList.remove("hidden");
  } else {
    document.getElementById("imagePreview").src = "";
    document.getElementById("imagePreview").classList.add("hidden");
  }

  clearVariantForm();
  displayVariants();
  showPage("admin");
}

async function deleteProduct(id) {
  if (!confirm("Tu veux vraiment supprimer ce produit ?")) return;

  const { error } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Erreur suppression produit.");
    return;
  }

  await loadProductsFromSupabase();
}

function resetForm() {
  document.getElementById("productId").value = "";
  document.getElementById("name").value = "";
  document.getElementById("description").value = "";
  document.getElementById("category").value = "Parfums";
  document.getElementById("type").value = "stock";
  document.getElementById("pasteZone").value = "";

  selectedImage = "";
  currentVariants = [];

  document.getElementById("imagePreview").src = "";
  document.getElementById("imagePreview").classList.add("hidden");

  clearVariantForm();
  displayVariants();
}

function displayAdminProducts() {
  const container = document.getElementById("adminProducts");
  if (!container) return;

  container.innerHTML = "";

  products.forEach(product => {
    container.innerHTML += `
      <div class="cart-item">
        <img src="${getProductMainImage(product)}" width="60" style="border-radius:10px;">
        <strong>${product.name}</strong><br>
        ${product.category || "Sans catégorie"} - ${product.type === "stock" ? "Stock Maroc" : "Sur commande"}<br>
        <button onclick="editProduct(${product.id})">Modifier</button>
        <button onclick="deleteProduct(${product.id})">Supprimer</button>
      </div>
    `;
  });
}

async function saveGift() {
  const giftName = document.getElementById("giftName").value.trim();
  const giftLimit = Number(document.getElementById("giftLimit").value);

  if (!giftName || !giftLimit) {
    alert("Remplis le nom du cadeau et le montant minimum.");
    return;
  }

  const { error } = await supabaseClient
    .from("gifts")
    .insert({
      name: giftName,
      minimum_amount: giftLimit
    });

  if (error) {
    console.error(error);
    alert("Erreur sauvegarde cadeau.");
    return;
  }

  giftOffer = {
    name: giftName,
    limit: giftLimit
  };

  displayCart();
  alert("Cadeau sauvegardé.");
}

async function initializeApp() {
  displayCart();
  setupPasteImage();
  setupVariantPasteImage();
  await loadGiftFromSupabase();
  await loadProductsFromSupabase();
}

initializeApp();