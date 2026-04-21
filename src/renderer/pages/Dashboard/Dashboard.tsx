import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toggleTheme } from "../../functions/theme";
import styles from "./Dashboard.module.css";

const Dashboard = () => {
  const [data, setData] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [reportType, setReportType] = useState("sales");
  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    setSearch("");
    refreshData();
    if (activeTab === "books" || showAddModal) loadCategories();
  }, [activeTab, reportType]);

  const loadCategories = async () => {
    const res = await window.api.invoke("db:get-categories");
    if (res) setCategories(res);
  };

  const loadOrderDependencies = async () => {
    const [usersRes, booksRes] = await Promise.all([
      window.api.invoke("db:get-users"),
      window.api.invoke("db:get-books"),
    ]);

    if (Array.isArray(usersRes)) {
      setUsers(usersRes);
    } else if (usersRes?.data) {
      setUsers(usersRes.data);
    }

    if (Array.isArray(booksRes)) {
      setBooks(booksRes);
    } else if (booksRes?.data) {
      setBooks(booksRes.data);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    const isAuth = await window.api.checkAuthStatus();
    if (!isAuth) {
      navigate("/login");
      return;
    }

    try {
      let result;
      if (activeTab === "home") {
        const [booksRes, ordersRaw, usersRaw] = await Promise.all([
          window.api.invoke("db:get-books"),
          window.api.invoke("db:get-orders"),
          window.api.invoke("db:get-users"),
        ]);
        const books = booksRes?.data || booksRes || [];
        setStatsData({
          totalRevenue:
            ordersRaw?.reduce(
              (sum: number, o: any) => sum + (o.FinalAmount || 0),
              0,
            ) || 0,
          pendingOrders:
            ordersRaw?.filter((o: any) => o.Status?.toLowerCase() === "pending")
              .length || 0,
          totalUsers: usersRaw?.length || 0,
          lowStockBooks: books.filter((b: any) => b.TotalStock < 10).length,
          topBooks: [...books]
            .sort((a, b) => (b.TotalSold || 0) - (a.TotalSold || 0))
            .slice(0, 5),
          recentOrders: ordersRaw?.slice(0, 5) || [],
        });
        result = { success: true, data: [] };
      } else if (activeTab === "books")
        result = await window.api.invoke("db:get-books");
      else if (activeTab === "orders")
        result = {
          success: true,
          data: await window.api.invoke("db:get-orders"),
        };
      else if (activeTab === "users")
        result = {
          success: true,
          data: await window.api.invoke("db:get-users"),
        };
      else if (activeTab === "categories")
        result = {
          success: true,
          data: await window.api.invoke("db:get-categories"),
        };
      else if (activeTab === "reports") {
        const reportData = await window.api.invoke(
          "db:get-reports",
          reportType,
        );
        result = {
          success: true,
          data: reportData,
        };
      }

      if (result?.success) setData(result.data || []);
    } catch (err) {
      console.error("Помилка завантаження даних:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let channel = "";
    let payload: any = activeTab === "categories" ? formData.name : formData;
    if (activeTab === "books") channel = "db:create-book";
    else if (activeTab === "users") channel = "db:create-user";
    else if (activeTab === "categories") channel = "db:create-category";
    else if (activeTab === "orders") {
      channel = "db:create-order";
      // Фільтруємо тільки валідні елементи (з вибраною книгою та кількістю > 0)
      const items = (formData.items || [])
        .filter((item: any) => item.bookId && Number(item.quantity) > 0)
        .map((item: any) => ({
          bookId: String(item.bookId),
          quantity: Number(item.quantity),
        }));

      if (!formData.userId) {
        alert("Оберіть користувача для замовлення");
        setIsSubmitting(false);
        return;
      }

      if (!items.length) {
        alert("Додайте хоча б одну книгу до замовлення");
        setIsSubmitting(false);
        return;
      }

      // Розраховуємо загальну суму на основі збережених цін в формі
      const finalAmount = (formData.items || []).reduce(
        (sum: number, item: any) =>
          sum + (item.price || 0) * (item.quantity || 1),
        0,
      );

      payload = {
        userId: String(formData.userId),
        finalAmount,
        items,
      };
    }

    try {
      const res = await window.api.invoke(channel, payload);
      if (res?.success) {
        setShowAddModal(false);
        setFormData({});
        refreshData();
      } else {
        alert(res?.message || "Помилка при збереженні");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let channel = "";
    let payload: any = {};

    if (activeTab === "books") {
      channel = "db:update-book";
      payload = {
        id: String(editingItem.Id),
        title: (formData.title || editingItem.Title).trim(),
        author: (formData.author || editingItem.Author).trim(),
        price: Number(formData.price || editingItem.Price),
        categoryId: String(formData.categoryId || editingItem.CategoryID),
        stock: Number(formData.stock || editingItem.TotalStock),
      };
    } else if (activeTab === "users") {
      channel = "db:update-user";
      payload = {
        id: String(editingItem.UserID),
        fullName: (formData.fullName || editingItem.FullName).trim(),
        email: (formData.email || editingItem.Email).trim(),
        role: formData.role || editingItem.Role,
      };
    } else if (activeTab === "orders") {
      channel = "db:update-order-status";
      payload = {
        id: String(editingItem.OrderID),
        status: formData.status || editingItem.Status,
      };
    }

    try {
      const res = await window.api.invoke(channel, payload);
      if (res?.success) {
        setShowEditModal(false);
        setEditingItem(null);
        setFormData({});
        refreshData();
      } else {
        alert(res?.message || "Помилка при оновленні");
      }
    } catch (err: any) {
      console.error("Помилка при оновленні:", err);
      alert("Помилка при оновленні: " + (err?.message || "Невідома помилка"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    if (activeTab === "books") {
      setFormData({
        title: item.Title,
        author: item.Author,
        price: item.Price,
        categoryId: item.CategoryID,
        stock: item.TotalStock,
      });
    } else if (activeTab === "users") {
      setFormData({
        fullName: item.FullName,
        email: item.Email,
        role: item.Role,
      });
    } else if (activeTab === "orders") {
      setFormData({
        status: item.Status,
      });
    }
    setShowEditModal(true);
  };

  const handleAction = async (action: string, id: string, extra?: any) => {
    if (!window.confirm("Ви впевнені?")) return;
    let res;
    if (action === "delete-book")
      res = await window.api.invoke("db:delete-book", id);
    if (action === "delete-user")
      res = await window.api.invoke("db:delete-user", id);
    if (action === "delete-category")
      res = await window.api.invoke("db:delete-category", id);
    if (action === "delete-order")
      res = await window.api.invoke("db:delete-order", id);
    if (action === "status-order")
      res = await window.api.invoke("db:update-order-status", {
        id,
        status: extra,
      });
    if (res?.success || res) refreshData();
  };

  const filteredData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    const term = search.toLowerCase().trim();
    return term
      ? data.filter((item: any) =>
          Object.values(item).some((v) =>
            String(v).toLowerCase().includes(term),
          ),
        )
      : data;
  }, [data, search]);

  return (
    <div className={styles.appLayout}>
      <aside className={`${styles.sidebar} glass-panel`}>
        <div className={styles.logoArea}>📚 BookStore DB</div>
        <nav className={styles.navMenu}>
          <button
            className={activeTab === "home" ? styles.active : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("home");
            }}
          >
            🏠 Головна
          </button>

          <button
            className={activeTab === "books" ? styles.active : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("books");
            }}
          >
            📖 Книги
          </button>

          <button
            className={activeTab === "categories" ? styles.active : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("categories");
            }}
          >
            📂 Категорії
          </button>

          <button
            className={activeTab === "orders" ? styles.active : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("orders");
            }}
          >
            📦 Замовлення
          </button>

          <button
            className={activeTab === "users" ? styles.active : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("users");
            }}
          >
            👥 Користувачі
          </button>

          <button
            className={activeTab === "reports" ? styles.active : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("reports");
            }}
          >
            📊 Звіти
          </button>
        </nav>
        <button
          onClick={async () => {
            await window.api.logout();
            navigate("/login");
          }}
          className={styles.logoutBtn}
        >
          Вийти
        </button>
      </aside>

      <main className={styles.content}>
        <header className={`${styles.topBar} glass-panel`}>
          {activeTab !== "home" ? (
            <div className={styles.searchWrapper}>
              <input
                type="text"
                placeholder={`Пошук...`}
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {["books", "users", "categories", "orders"].includes(
                activeTab,
              ) && (
                <button
                  className={styles.addBtn}
                  onClick={async () => {
                    if (activeTab === "orders") {
                      await loadOrderDependencies();
                      setFormData({
                        userId: "",
                        items: [{ bookId: "", quantity: 1 }],
                        total: 0,
                      });
                    } else {
                      setFormData({});
                    }
                    setShowAddModal(true);
                  }}
                >
                  + Додати
                </button>
              )}
            </div>
          ) : (
            <div className={styles.greeting}>
              Вітаємо у панелі керування! 👋
            </div>
          )}
          <button onClick={toggleTheme} className={styles.themeBtn}>
            🌗
          </button>
        </header>

        <div className={`${styles.tableContainer} glass-panel`}>
          <div className={styles.tableHeader}>
            <h2>{activeTab === "home" ? "Огляд" : activeTab.toUpperCase()}</h2>
            {activeTab === "reports" && (
              <div className={styles.reportToggle}>
                <button
                  className={reportType === "sales" ? styles.active : ""}
                  onClick={() => setReportType("sales")}
                >
                  Книги
                </button>
                <button
                  className={reportType === "customers" ? styles.active : ""}
                  onClick={() => setReportType("customers")}
                >
                  Клієнти
                </button>
                <button
                  className={
                    reportType === "PriceAnalysis" ? styles.active : ""
                  }
                  onClick={() => setReportType("PriceAnalysis")}
                >
                  Зміна цін
                </button>
              </div>
            )}
            <button
              className={`${styles.refreshBtn} ${isLoading ? styles.loading : ""}`}
              onClick={refreshData}
            >
              🔄
            </button>
          </div>

          <div className={styles.tableScroll}>
            {isLoading ? (
              <div className={styles.loader}>Синхронізація з хмарою...</div>
            ) : activeTab === "home" && statsData ? (
              <div className={`${styles.dashboardHome} fade-in`}>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <span>Дохід</span>
                    <div className={styles.val}>{statsData.totalRevenue} ₴</div>
                  </div>
                  <div className={styles.statCard}>
                    <span>Pending</span>
                    <div className={styles.val}>{statsData.pendingOrders}</div>
                  </div>
                  <div className={styles.statCard}>
                    <span>Клієнти</span>
                    <div className={styles.val}>{statsData.totalUsers}</div>
                  </div>
                  <div className={styles.statCard}>
                    <span>Низький запас</span>
                    <div className={`${styles.val} ${styles.danger}`}>
                      {statsData.lowStockBooks}
                    </div>
                  </div>
                </div>
                <div className={styles.dashboardTables}>
                  <div className={styles.dashBox}>
                    <h3>Топ-5 книг 🏆</h3>
                    {statsData.topBooks.map((b: any) => (
                      <div key={b.Id} className={styles.dashItem}>
                        <span>{b.Title}</span>
                        <b>{b.TotalSold} шт.</b>
                      </div>
                    ))}
                  </div>
                  <div className={styles.dashBox}>
                    <h3>Останні замовлення 🕒</h3>
                    {statsData.recentOrders.map((o: any) => (
                      <div key={o.OrderID} className={styles.dashItem}>
                        <span>
                          #{o.OrderID} - {o.FullName}
                        </span>
                        <b>{o.FinalAmount} ₴</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <table>
                <thead>
                  {activeTab === "books" && (
                    <tr>
                      <th>Назва</th>
                      <th>Ціна</th>
                      <th>Склад</th>
                      <th>Дії</th>
                    </tr>
                  )}
                  {activeTab === "orders" && (
                    <tr>
                      <th>ID</th>
                      <th>Клієнт</th>
                      <th>Сума</th>
                      <th>Статус</th>
                      <th>Дії</th>
                    </tr>
                  )}
                  {activeTab === "users" && (
                    <tr>
                      <th>ID</th>
                      <th>Ім'я</th>
                      <th>Email</th>
                      <th>Роль</th>
                      <th>Дії</th>
                    </tr>
                  )}
                  {activeTab === "categories" && (
                    <tr>
                      <th>ID</th>
                      <th>Назва</th>
                      <th>Дії</th>
                    </tr>
                  )}
                  {activeTab === "reports" && reportType === "sales" && (
                    <tr>
                      <th>Назва</th>
                      <th>Категорія</th>
                      <th>Продано</th>
                      <th>Дохід</th>
                    </tr>
                  )}
                  {activeTab === "reports" && reportType === "customers" && (
                    <tr>
                      <th>Клієнт</th>
                      <th>Email</th>
                      <th>Замовлень</th>
                      <th>Витрачено</th>
                    </tr>
                  )}
                  {activeTab === "reports" &&
                    reportType === "PriceAnalysis" && (
                      <tr>
                        <th>Назва книги</th>
                        <th>Стара ціна</th>
                        <th>Нова ціна</th>
                        <th>Дата зміни</th>
                      </tr>
                    )}
                </thead>
                <tbody>
                  {filteredData.map((item: any) => (
                    <tr
                      key={
                        item.Id ||
                        item.OrderID ||
                        item.UserID ||
                        item.id ||
                        Math.random()
                      }
                    >
                      {activeTab === "books" && (
                        <>
                          <td>
                            <b>{item.Title}</b>
                            <br />
                            <small>{item.Author}</small>
                          </td>
                          <td>{item.Price} ₴</td>
                          <td>{item.TotalStock} шт</td>
                          <td>
                            <button
                              onClick={() => openEditModal(item)}
                              className={styles.btnIcon}
                              title="Редагувати"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() =>
                                handleAction("delete-book", item.Id)
                              }
                              className={styles.btnIcon}
                              title="Видалити"
                            >
                              🗑️
                            </button>
                          </td>
                        </>
                      )}
                      {activeTab === "orders" && (
                        <>
                          <td>#{item.OrderID}</td>
                          <td>{item.FullName}</td>
                          <td>{item.FinalAmount} ₴</td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${item.Status?.toLowerCase()}`}
                            >
                              {item.Status}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => openEditModal(item)}
                              className={styles.btnIcon}
                              title="Редагувати"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() =>
                                handleAction("delete-order", item.OrderID)
                              }
                              className={styles.btnIcon}
                              title="Видалити"
                            >
                              🗑️
                            </button>
                          </td>
                        </>
                      )}
                      {activeTab === "users" && (
                        <>
                          <td>{item.UserID}</td>
                          <td>
                            <b>{item.FullName}</b>
                          </td>
                          <td>{item.Email}</td>
                          <td>
                            <span className={styles.roleBadge}>
                              {item.Role}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => openEditModal(item)}
                              className={styles.btnIcon}
                              title="Редагувати"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() =>
                                handleAction("delete-user", item.UserID)
                              }
                              className={styles.btnIcon}
                              title="Видалити"
                            >
                              🗑️
                            </button>
                          </td>
                        </>
                      )}
                      {activeTab === "categories" && (
                        <>
                          <td>{item.id}</td>
                          <td>
                            <b>{item.name}</b>
                          </td>
                          <td>
                            <button
                              onClick={() =>
                                handleAction("delete-category", item.id)
                              }
                              className={styles.btnIcon}
                            >
                              🗑️
                            </button>
                          </td>
                        </>
                      )}
                      {activeTab === "reports" && reportType === "sales" && (
                        <>
                          <td>{item.BookTitle}</td>
                          <td>{item.CategoryName}</td>
                          <td>{item.CopiesSold} шт</td>
                          <td className="text-success">
                            {item.GeneratedRevenue} ₴
                          </td>
                        </>
                      )}
                      {activeTab === "reports" &&
                        reportType === "customers" && (
                          <>
                            <td>{item.FullName}</td>
                            <td>{item.Email}</td>
                            <td>{item.TotalOrders}</td>
                            <td className="text-success">
                              {item.TotalSpent} ₴
                            </td>
                          </>
                        )}
                      {activeTab === "reports" &&
                        reportType === "PriceAnalysis" && (
                          <>
                            <td>{item.BookTitle}</td>
                            <td>{item.OldPrice} ₴</td>
                            <td>{item.NewPrice} ₴</td>
                            <td>
                              {item.ChangeDate
                                ? new Date(item.ChangeDate).toLocaleDateString(
                                    "uk-UA",
                                    {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )
                                : "Невідомо"}
                            </td>
                          </>
                        )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} glass-panel fade-in`}>
            <h3>
              {activeTab === "categories"
                ? "📂 Нова категорія"
                : activeTab === "books"
                  ? "📖 Додати книгу"
                  : activeTab === "users"
                    ? "👥 Новий користувач"
                    : "📦 Нове замовлення"}
            </h3>
            <form onSubmit={handleCreate}>
              {activeTab === "categories" && (
                <input
                  required
                  placeholder="Назва категорії"
                  onChange={(e) => setFormData({ name: e.target.value })}
                />
              )}
              {activeTab === "books" && (
                <>
                  <input
                    required
                    placeholder="Назва"
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                  <input
                    required
                    placeholder="Автор"
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                  />
                  <select
                    required
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                  >
                    <option value="">Оберіть категорію</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    type="number"
                    placeholder="Ціна"
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                  <input
                    required
                    type="number"
                    placeholder="Запас на складі"
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                  />
                </>
              )}
              {activeTab === "users" && (
                <>
                  <input
                    required
                    placeholder="Повне ім'я"
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                  <input
                    required
                    type="email"
                    placeholder="Email"
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                  <input
                    required
                    type="password"
                    placeholder="Пароль"
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </>
              )}
              {activeTab === "orders" && (
                <>
                  <select
                    required
                    value={formData.userId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, userId: e.target.value })
                    }
                  >
                    <option value="">Оберіть користувача</option>
                    {users.map((u) => (
                      <option key={u.UserID} value={u.UserID}>
                        {u.FullName} ({u.Email})
                      </option>
                    ))}
                  </select>
                  <div className={styles.orderItems}>
                    {formData.items?.map((item: any, index: number) => (
                      <div key={index} className={styles.orderItem}>
                        <select
                          required
                          value={item.bookId || ""}
                          onChange={(e) => {
                            const newItems = [...formData.items];
                            newItems[index].bookId = e.target.value;
                            const selectedBook = books.find(
                              (b) => b.Id == e.target.value,
                            );
                            newItems[index].price = selectedBook
                              ? selectedBook.Price
                              : 0;
                            setFormData({ ...formData, items: newItems });
                          }}
                        >
                          <option value="">Оберіть книгу</option>
                          {books.map((b) => (
                            <option key={b.Id} value={b.Id}>
                              {b.Title} - {b.Price}₴
                            </option>
                          ))}
                        </select>
                        <input
                          required
                          type="number"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) => {
                            const newItems = [...formData.items];
                            newItems[index].quantity = Number(e.target.value);
                            setFormData({ ...formData, items: newItems });
                          }}
                        />
                        <span>{(item.price || 0) * (item.quantity || 1)}₴</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = formData.items.filter(
                              (_: any, i: number) => i !== index,
                            );
                            setFormData({ ...formData, items: newItems });
                          }}
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          items: [
                            ...formData.items,
                            { bookId: "", quantity: 1 },
                          ],
                        })
                      }
                    >
                      + Додати книгу
                    </button>
                  </div>
                  <div className={styles.total}>
                    Загальна сума:{" "}
                    {formData.items?.reduce(
                      (sum: number, item: any) =>
                        sum + (item.price || 0) * (item.quantity || 1),
                      0,
                    ) || 0}
                    ₴
                  </div>
                </>
              )}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Збереження..." : "Створити"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} glass-panel fade-in`}>
            <h3>
              {activeTab === "books"
                ? "📖 Редагувати книгу"
                : activeTab === "orders"
                  ? "📦 Редагувати замовлення"
                  : "👥 Редагувати користувача"}
            </h3>
            <form onSubmit={handleUpdate}>
              {activeTab === "books" && (
                <>
                  <input
                    required
                    placeholder="Назва"
                    defaultValue={editingItem?.Title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                  <input
                    required
                    placeholder="Автор"
                    defaultValue={editingItem?.Author}
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                  />
                  <select
                    required
                    defaultValue={editingItem?.CategoryID}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                  >
                    <option value="">Оберіть категорію</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    type="number"
                    placeholder="Ціна"
                    defaultValue={editingItem?.Price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                  <input
                    required
                    type="number"
                    placeholder="Запас на складі"
                    defaultValue={editingItem?.TotalStock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                  />
                </>
              )}
              {activeTab === "users" && (
                <>
                  <input
                    required
                    placeholder="Повне ім'я"
                    defaultValue={editingItem?.FullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                  <input
                    required
                    type="email"
                    placeholder="Email"
                    defaultValue={editingItem?.Email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                  <select
                    required
                    defaultValue={editingItem?.Role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </>
              )}
              {activeTab === "orders" && (
                <>
                  <label>Статус замовлення</label>
                  <select
                    required
                    defaultValue={editingItem?.Status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </>
              )}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                    setFormData({});
                  }}
                  disabled={isSubmitting}
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Збереження..." : "Оновити"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
