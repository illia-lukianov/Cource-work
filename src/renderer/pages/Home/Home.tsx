import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";

const Home = () => {
  const navigate = useNavigate();
  
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [sortBy, setSortBy] = useState("default");
  
  const [showCartModal, setShowCartModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [booksRes, catRes] = await Promise.all([
        window.api.invoke("db:get-books-for-users"),
        window.api.invoke("db:get-categories"),
      ]);
      setBooks(Array.isArray(booksRes) ? booksRes : booksRes?.data || []);
      setCategories(Array.isArray(catRes) ? catRes : catRes?.data || []);
    } catch (error) {
      console.error("Помилка завантаження:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Ви впевнені, що хочете вийти?")) {
      await window.api.logout();
      navigate("/login");
    }
  };

  const openAddToCart = (book: any) => {
    setSelectedBook(book);
    setQuantity(1);
    setShowCartModal(true);
  };

const addToCartConfirm = () => {
  const savedCart = localStorage.getItem("bookstore_cart");
  const cart = savedCart ? JSON.parse(savedCart) : [];

  // Отримуємо ID поточної книги (дивлячись на скриншот, це BookID або Id)
  const currentId = selectedBook.BookID || selectedBook.Id;

  const existingIndex = cart.findIndex((item: any) => {
    // Порівнюємо по Id (або іншому полю, яке ми точно запишемо нижче)
    const itemId = item.BookId || item.Id || item.BookID;
    return Number(itemId) === Number(currentId);
  });

  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    // ВАЖЛИВО: Явно записуємо BookId при першому додаванні
    cart.push({ 
      BookId: currentId, // ОСЬ ЦЬОГО НЕ ВИСТАЧАЛО
      Title: selectedBook.Title,
      Author: selectedBook.Author,
      Price: selectedBook.Price,
      TotalStock: selectedBook.Quantity || selectedBook.TotalStock,
      quantity: quantity 
    });
  }

  localStorage.setItem("bookstore_cart", JSON.stringify(cart));
  
  setShowCartModal(false);
  alert(`Додано "${selectedBook.Title}" (${quantity} шт.) до кошика!`);
};

  const processedBooks = useMemo(() => {
    const result = books.filter((book) => {
      const matchesSearch = book.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            book.Author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? (book.CategoryID === selectedCategory) : true;
      const matchesPrice = book.Price >= priceRange.min && book.Price <= priceRange.max;
      return matchesSearch && matchesCategory && matchesPrice;
    });

    if (sortBy === "price-asc") result.sort((a, b) => a.Price - b.Price);
    if (sortBy === "price-desc") result.sort((a, b) => b.Price - a.Price);
    if (sortBy === "title") result.sort((a, b) => a.Title.localeCompare(b.Title));

    return result;
  }, [books, searchQuery, selectedCategory, priceRange, sortBy]);

  return (
    <div className={styles.homeContainer}>
      <nav className={styles.topNav}>
        <div className={styles.logo}>📚 Bookstore</div>
        <div className={styles.navActions}>
          <button className={styles.cartBtn} onClick={() => navigate("/cart")}>Кошик</button>
          <button className={styles.logoutBtn} onClick={handleLogout}>Вийти 🚪</button>
        </div>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Ваша ідеальна книга чекає 📖</h1>
          <div className={styles.searchBar}>
            <input 
              type="text" 
              placeholder="Шукати за назвою або автором..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>
        </div>
      </header>

      <div className={styles.mainLayout}>
        <aside className={styles.categorySidebar}>
          <div className={styles.filterGroup}>
            <h3>Категорії</h3>
            <button
              className={selectedCategory === null ? styles.activeCat : ""}
              onClick={() => setSelectedCategory(null)}
            >
              Всі жанри
            </button>
            {categories.map((cat) => (
              <button
                key={cat.CategoryID || cat.id}
                className={selectedCategory === (cat.CategoryID || cat.id) ? styles.activeCat : ""}
                onClick={() => setSelectedCategory(cat.CategoryID || cat.id)}
              >
                {cat.CategoryName || cat.name}
              </button>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <h3>Ціна (₴)</h3>
            <div className={styles.priceInputs}>
              <input 
                type="number" 
                placeholder="Від" 
                value={priceRange.min}
                onChange={(e) => setPriceRange({...priceRange, min: Number(e.target.value)})} 
              />
              <input 
                type="number" 
                placeholder="До" 
                value={priceRange.max}
                onChange={(e) => setPriceRange({...priceRange, max: Number(e.target.value)})} 
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <h3>Сортування</h3>
            <select className={styles.sortSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="default">За замовчуванням</option>
              <option value="price-asc">Дешевші спочатку</option>
              <option value="price-desc">Дорожчі спочатку</option>
              <option value="title">За назвою (А-Я)</option>
            </select>
          </div>
        </aside>

        <main className={styles.booksContent}>
          {isLoading ? (
            <div className={styles.loader}>Завантаження...</div>
          ) : (
            <>
              <div className={styles.resultsInfo}>Знайдено: {processedBooks.length}</div>
              <div className={styles.booksGrid}>
                {processedBooks.map((book) => (
                  <div key={book.Id} className={styles.bookCard}>
                    <div className={styles.bookCover}>📖</div>
                    <div className={styles.bookInfo}>
                      <h4 className={styles.title}>{book.Title}</h4>
                      <p className={styles.author}>{book.Author}</p>
                      <div className={styles.cardFooter}>
                        <span className={styles.price}>{book.Price} ₴</span>
                        <button 
                          className={styles.buyBtn}
                          onClick={() => openAddToCart(book)}
                          disabled={book.Quantity <= 0}
                        >
                          {book.Quantity > 0 ? "В кошик" : "Немає"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {showCartModal && selectedBook && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Додати до кошика</h3>
            <p><strong>{selectedBook.Title}</strong></p>
            <div className={styles.quantityPicker}>
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span className={styles.quantityValue}>{quantity}</span>
              <button type="button" onClick={() => setQuantity(Math.min(selectedBook.Quantity, quantity + 1))}>+</button>
            </div>
            <div className={styles.totalPrice}>Разом: {selectedBook.Price * quantity} ₴</div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowCartModal(false)}>Скасувати</button>
              <button className={styles.confirmBtn} onClick={addToCartConfirm}>Додати</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;