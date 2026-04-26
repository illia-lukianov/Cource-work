import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Cart.module.css";

interface CartItem {
  BookId: number;
  Title: string;
  Author: string;
  Price: number;
  quantity: number;
  TotalStock: number;
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedCart = localStorage.getItem("bookstore_cart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem("bookstore_cart", JSON.stringify(items));
  };

  const updateQuantity = (id: number, delta: number) => {
    const newItems = cartItems.map((item) => {
      if (item.BookId === id) {
        const newQty = Math.max(
          1,
          Math.min(item.TotalStock || 100, item.quantity + delta),
        );
        return { ...item, quantity: newQty };
      }
      return item;
    });
    saveCart(newItems);
  };

  const removeItem = (id: number) => {
    if (window.confirm("Видалити цей товар з кошика?")) {
      const newItems = cartItems.filter((item) => item.BookId !== id);
      saveCart(newItems);
    }
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.Price * item.quantity,
    0,
  );

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);

    try {
      const currentUser =
        localStorage.getItem("bookstore_user") || localStorage.getItem("user");
      if (!currentUser) {
        alert("Будь ласка, увійдіть в систему для оформлення замовлення");
        navigate("/login");
        return;
      }
      const user = await window.api.getCurrentUser(JSON.parse(currentUser));
      console.log("🚀 ~ handleCheckout ~ user:", user);

      const orderData = {
        userId: Number(user.id),
        finalAmount: totalPrice,
        items: cartItems.map((item) => ({
          bookId: item.BookId,
          quantity: item.quantity,
        })),
      };

      const res = await window.api.db.createOrder(orderData);

      if (res.success) {
        alert("Замовлення успішно оформлено! 🎉");
        localStorage.removeItem("bookstore_cart");
        setCartItems([]);
        navigate("/");
      } else {
        alert("Сталася помилка при з'єднанні з базою даних");
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.cartPage}>
      <nav className={styles.topNav}>
        <button onClick={() => navigate("/")} className={styles.backBtn}>
          ← Назад до магазину
        </button>
        <h1>Мій Кошик 🛒</h1>
      </nav>

      <div className={styles.cartContainer}>
        {cartItems.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Ваш кошик порожній 🕸️</h2>
            <p>Схоже, ви ще не додали жодної книги.</p>
            <button onClick={() => navigate("/")} className={styles.shopBtn}>
              Перейти до покупок
            </button>
          </div>
        ) : (
          <div className={styles.cartLayout}>
            <div className={styles.itemsList}>
              {cartItems.map((item) => (
                <div key={item.BookId} className={styles.cartItem}>
                  <div className={styles.itemInfo}>
                    <h3>{item.Title}</h3>
                    <p>{item.Author}</p>
                    <span className={styles.unitPrice}>
                      {item.Price} ₴ / шт.
                    </span>
                  </div>

                  <div className={styles.itemActions}>
                    <div className={styles.quantityPicker}>
                      <button onClick={() => updateQuantity(item.BookId, -1)}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.BookId, 1)}>
                        +
                      </button>
                    </div>
                    <div className={styles.itemTotal}>
                      {item.Price * item.quantity} ₴
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(item.BookId)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <aside className={styles.summaryCard}>
              <h3>Підсумок замовлення</h3>
              <div className={styles.summaryRow}>
                <span>Товари ({cartItems.length}):</span>
                <span>{totalPrice} ₴</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Доставка:</span>
                <span className={styles.free}>Безкоштовно</span>
              </div>
              <hr />
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Загальна сума:</span>
                <span>{totalPrice} ₴</span>
              </div>
              <button
                className={styles.checkoutBtn}
                onClick={handleCheckout}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Оформлення..." : "Оформити замовлення"}
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
