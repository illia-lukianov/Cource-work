import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";

const Home = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<any | null>(null);
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
    const fetchUser = async () => {
      const currentUser = await checkAuth();
      setUser(currentUser);
    };

    fetchUser();
  }, []);
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [booksRes, catRes] = await Promise.all([
        window.api.db.getBooksForUsers(),
        window.api.db.getCategories(),
      ]);
      setBooks(booksRes?.data || []);
      setCategories(catRes?.data || []);
    } catch (error) {
      console.error("Помилка завантаження:", error);
    } finally {
      setIsLoading(false);
    }
  };

  async function checkAuth() {
    const currentUser = JSON.parse(
      localStorage.getItem("bookstore_user") ||
        localStorage.getItem("user") ||
        "null",
    );
    if (currentUser) {
      try {
        const user = await window.api.getCurrentUser(currentUser);
        return user;
      } catch (err) {
        console.error("Помилка отримання поточного користувача:", err);
        return null;
      }
    }
    return null;
  }

  const handleLogout = async () => {
    if (window.confirm("Ви впевнені, що хочете вийти?")) {
      localStorage.removeItem("bookstore_user");
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

    const currentId = selectedBook.BookID || selectedBook.Id;

    const existingIndex = cart.findIndex((item: any) => {
      const itemId = item.BookId || item.Id || item.BookID;
      return Number(itemId) === Number(currentId);
    });

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        BookId: currentId,
        Title: selectedBook.Title,
        Author: selectedBook.Author,
        Price: selectedBook.Price,
        TotalStock: selectedBook.Quantity || selectedBook.TotalStock,
        quantity: quantity,
      });
    }

    localStorage.setItem("bookstore_cart", JSON.stringify(cart));

    setShowCartModal(false);
  };

  const processedBooks = useMemo(() => {
    const result = books.filter((book) => {
      const matchesSearch =
        book.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.Author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory
        ? book.CategoryID === selectedCategory
        : true;
      const matchesPrice =
        book.Price >= priceRange.min && book.Price <= priceRange.max;
      return matchesSearch && matchesCategory && matchesPrice;
    });

    if (sortBy === "price-asc") result.sort((a, b) => a.Price - b.Price);
    if (sortBy === "price-desc") result.sort((a, b) => b.Price - a.Price);
    if (sortBy === "title")
      result.sort((a, b) => a.Title.localeCompare(b.Title));

    return result;
  }, [books, searchQuery, selectedCategory, priceRange, sortBy]);

  return (
    <div className={styles.homeContainer}>
      <nav className={styles.topNav}>
        <div className={styles.logo}>📚 Bookstore</div>
        <div className={styles.navActions}>
          {user?.role === "Admin" && (
            <button
              className={styles.cartBtn}
              onClick={() => navigate("/dashboard")}
            >
              Панель керування
            </button>
          )}
          <button className={styles.cartBtn} onClick={() => navigate("/cart")}>
            Кошик
          </button>
          {user ? (
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Вийти 🚪
            </button>
          ) : (
            <button
              className={styles.cartBtn}
              onClick={() => navigate("/login")}
            >
              Увійти 🔐
            </button>
          )}
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
                className={
                  selectedCategory === (cat.CategoryID || cat.id)
                    ? styles.activeCat
                    : ""
                }
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
                onChange={(e) =>
                  setPriceRange({ ...priceRange, min: Number(e.target.value) })
                }
              />
              <input
                type="number"
                placeholder="До"
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange({ ...priceRange, max: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <h3>Сортування</h3>
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
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
              <div className={styles.resultsInfo}>
                Знайдено: {processedBooks.length}
              </div>
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
            <p>
              <strong>{selectedBook.Title}</strong>
            </p>
            <div className={styles.quantityPicker}>
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <span className={styles.quantityValue}>{quantity}</span>
              <button
                type="button"
                onClick={() =>
                  setQuantity(Math.min(selectedBook.Quantity, quantity + 1))
                }
              >
                +
              </button>
            </div>
            <div className={styles.totalPrice}>
              Разом: {selectedBook.Price * quantity} ₴
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowCartModal(false)}
              >
                Скасувати
              </button>
              <button className={styles.confirmBtn} onClick={addToCartConfirm}>
                Додати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
