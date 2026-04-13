import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toggleTheme } from '../functions/theme';

const Dashboard = () => {
  const [data, setData] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [activeTab, setActiveTab] = useState('home');
  const [reportType, setReportType] = useState('sales');
  const [search, setSearch] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [categories, setCategories] = useState<any[]>([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    setSearch(''); 
    refreshData();
    if (activeTab === 'books' || showAddModal) loadCategories();
  }, [activeTab, reportType]);

  const loadCategories = async () => {
    const res = await window.api.invoke("db:get-categories");
    if (res) setCategories(res);
  };

  const refreshData = async () => {
    setIsLoading(true);
    const isAuth = await window.api.checkAuthStatus();
    if (!isAuth) { navigate('/login'); return; }

    try {
      let result;
      if (activeTab === 'home') {
        const [booksRes, ordersRaw, usersRaw] = await Promise.all([
          window.api.invoke("db:get-books"),
          window.api.invoke("db:get-orders"),
          window.api.invoke("db:get-users")
        ]);
        const books = booksRes?.data || [];
        setStatsData({
          totalRevenue: ordersRaw?.reduce((sum: number, o: any) => sum + (o.FinalAmount || 0), 0) || 0,
          pendingOrders: ordersRaw?.filter((o: any) => o.Status?.toLowerCase() === 'pending').length || 0,
          totalUsers: usersRaw?.length || 0,
          lowStockBooks: books.filter((b: any) => b.TotalStock < 10).length,
          topBooks: [...books].sort((a, b) => (b.TotalSold || 0) - (a.TotalSold || 0)).slice(0, 5),
          recentOrders: ordersRaw?.slice(0, 5) || []
        });
        result = { success: true, data: [] };
      } 
      else if (activeTab === 'books') result = await window.api.invoke("db:get-books");
      else if (activeTab === 'orders') result = { success: true, data: await window.api.invoke("db:get-orders") };
      else if (activeTab === 'users') result = { success: true, data: await window.api.invoke("db:get-users") };
      else if (activeTab === 'categories') result = { success: true, data: await window.api.invoke("db:get-categories") };
      else if (activeTab === 'reports') result = { success: true, data: await window.api.invoke("db:get-reports", reportType) };
      
      if (result?.success) setData(result.data || []);
    } catch (err) { console.error(err); } 
    finally { setIsLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let channel = "";
    if (activeTab === 'books') channel = "db:create-book";
    else if (activeTab === 'users') channel = "db:create-user";
    else if (activeTab === 'categories') channel = "db:create-category";

    try {
      const res = await window.api.invoke(channel, activeTab === 'categories' ? formData.name : formData);
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

  const handleAction = async (action: string, id: string, extra?: any) => {
    if (!window.confirm("Ви впевнені?")) return;
    let res;
    if (action === 'delete-book') res = await window.api.invoke("db:delete-book", id);
    if (action === 'delete-user') res = await window.api.invoke("db:delete-user", id);
    if (action === 'delete-category') res = await window.api.invoke("db:delete-category", id);
    if (action === 'status-order') res = await window.api.invoke("db:update-order-status", { id, status: extra });
    if (res?.success || res) refreshData();
  };

  const filteredData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    const term = search.toLowerCase().trim();
    return term ? data.filter((item: any) => Object.values(item).some(v => String(v).toLowerCase().includes(term))) : data;
  }, [data, search]);

  return (
    <div className="app-layout">
      <aside className="sidebar glass-panel">
        <div className="logo-area">📚 BookStore DB</div>
        <nav className="nav-menu">
          <button
            className={activeTab === "home" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("home");
            }}
          >
            🏠 Головна
          </button>

          <button
            className={activeTab === "books" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("books");
            }}
          >
            📖 Книги
          </button>

          <button
            className={activeTab === "categories" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("categories");
            }}
          >
            📂 Категорії
          </button>

          <button
            className={activeTab === "orders" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("orders");
            }}
          >
            📦 Замовлення
          </button>

          <button
            className={activeTab === "users" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("users");
            }}
          >
            👥 Користувачі
          </button>

          <button
            className={activeTab === "reports" ? "active" : ""}
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
          className="logout-btn"
        >
          Вийти
        </button>
      </aside>

      <main className="content">
        <header className="top-bar glass-panel">
          {activeTab !== "home" ? (
            <div className="search-wrapper">
              <input
                type="text"
                placeholder={`Пошук...`}
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {["books", "users", "categories"].includes(activeTab) && (
                <button
                  className="add-btn"
                  onClick={() => {
                    setFormData({});
                    setShowAddModal(true);
                  }}
                >
                  + Додати
                </button>
              )}
            </div>
          ) : (
            <div className="greeting">Вітаємо у панелі керування! 👋</div>
          )}
          <button onClick={toggleTheme} className="theme-btn">
            🌗
          </button>
        </header>

        <div className="table-container glass-panel">
          <div className="table-header">
            <h2>{activeTab === "home" ? "Огляд" : activeTab.toUpperCase()}</h2>
            {activeTab === "reports" && (
              <div className="report-toggle">
                <button
                  className={reportType === "sales" ? "active" : ""}
                  onClick={() => setReportType("sales")}
                >
                  Книги
                </button>
                <button
                  className={reportType === "customers" ? "active" : ""}
                  onClick={() => setReportType("customers")}
                >
                  Клієнти
                </button>
              </div>
            )}
            <button
              className={`refresh-btn ${isLoading ? "loading" : ""}`}
              onClick={refreshData}
            >
              🔄
            </button>
          </div>

          <div className="table-scroll">
            {isLoading ? (
              <div className="loader">Синхронізація з хмарою...</div>
            ) : activeTab === "home" && statsData ? (
              <div className="dashboard-home fade-in">
                <div className="stats-grid">
                  <div className="stat-card">
                    <span>Дохід</span>
                    <div className="val">{statsData.totalRevenue} ₴</div>
                  </div>
                  <div className="stat-card">
                    <span>Pending</span>
                    <div className="val">{statsData.pendingOrders}</div>
                  </div>
                  <div className="stat-card">
                    <span>Клієнти</span>
                    <div className="val">{statsData.totalUsers}</div>
                  </div>
                  <div className="stat-card">
                    <span>Низький запас</span>
                    <div className="val danger">{statsData.lowStockBooks}</div>
                  </div>
                </div>
                <div className="dashboard-tables">
                  <div className="dash-box">
                    <h3>Топ-5 книг 🏆</h3>
                    {statsData.topBooks.map((b: any) => (
                      <div key={b.Id} className="dash-item">
                        <span>{b.Title}</span>
                        <b>{b.TotalSold} шт.</b>
                      </div>
                    ))}
                  </div>
                  <div className="dash-box">
                    <h3>Останні замовлення 🕒</h3>
                    {statsData.recentOrders.map((o: any) => (
                      <div key={o.OrderID} className="dash-item">
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
                              onClick={() =>
                                handleAction("delete-book", item.Id)
                              }
                              className="btn-icon"
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
                              className={`status-badge ${item.Status?.toLowerCase()}`}
                            >
                              {item.Status}
                            </span>
                          </td>
                          <td>
                            <select
                              value={item.Status}
                              onChange={(e) =>
                                handleAction(
                                  "status-order",
                                  item.OrderID,
                                  e.target.value,
                                )
                              }
                              className="status-select"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                            </select>
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
                            <span className="role-badge">{item.Role}</span>
                          </td>
                          <td>
                            <button
                              onClick={() =>
                                handleAction("delete-user", item.UserID)
                              }
                              className="btn-icon"
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
                              className="btn-icon"
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel fade-in">
            <h3>
              {activeTab === "categories"
                ? "📂 Нова категорія"
                : activeTab === "books"
                  ? "📖 Додати книгу"
                  : "👥 Новий користувач"}
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
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Збереження..." : "Створити"}
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