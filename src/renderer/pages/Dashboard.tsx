import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toggleTheme } from '../functions/theme';

const Dashboard = () => {
  const [data, setData] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [reportType, setReportType] = useState('sales'); // Стан для типу звіту
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Додали reportType в залежності, щоб дані оновлювались при перемиканні
  useEffect(() => {
    setSearch(''); 
    refreshData();
  }, [activeTab, reportType]);

  const refreshData = async () => {
    setIsLoading(true);
    setData([]); 
    setStatsData(null);
    
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
        const orders = ordersRaw || [];
        const users = usersRaw || [];

        setStatsData({
          totalRevenue: orders.filter((o: any) => o.Status !== 'Cancelled').reduce((sum: number, o: any) => sum + (o.FinalAmount || 0), 0),
          pendingOrders: orders.filter((o: any) => o.Status?.toLowerCase() === 'pending').length,
          lowStockBooks: books.filter((b: any) => b.TotalStock < 10).length,
          totalUsers: users.length,
          topBooks: [...books].sort((a, b) => (b.TotalSold || 0) - (a.TotalSold || 0)).slice(0, 5),
          recentOrders: orders.slice(0, 5)
        });
        
        result = { success: true, data: [] };
      } 
      else if (activeTab === 'books') {
        result = await window.api.invoke("db:get-books");
      } else if (activeTab === 'orders') {
        const rawData = await window.api.invoke("db:get-orders");
        result = { success: true, data: rawData };
      } else if (activeTab === 'users') {
        const rawData = await window.api.invoke("db:get-users");
        result = { success: true, data: rawData };
      } else if (activeTab === 'reports') {
        // Передаємо обраний тип звіту на бекенд
        const rawData = await window.api.invoke("db:get-reports", reportType);
        result = { success: true, data: rawData };
      }
      
      if (result?.success) {
        setData(result.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: string, id: string, extra?: any) => {
    if (!window.confirm("Ви впевнені?")) return;
    
    let res;
    if (action === 'delete-book') res = await window.api.invoke("db:delete-book", id);
    if (action === 'delete-user') res = await window.api.invoke("db:delete-user", id);
    if (action === 'status-order') res = await window.api.invoke("db:update-order-status", { id, status: extra });

    if (res?.success || res) refreshData();
  };

  const filteredData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    const term = search.toLowerCase().trim();
    if (!term) return data; 

    return data.filter((item: any) => {
      const getVal = (obj: any, key: string) => {
        const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
        return foundKey ? String(obj[foundKey]).toLowerCase() : "";
      };

      if (activeTab === 'books') return getVal(item, 'Title').includes(term) || getVal(item, 'Author').includes(term);
      if (activeTab === 'users') return getVal(item, 'FullName').includes(term) || getVal(item, 'Email').includes(term);
      if (activeTab === 'orders') return getVal(item, 'OrderID').includes(term) || getVal(item, 'FullName').includes(term);
      
      // Пошук для звітів
      if (activeTab === 'reports') {
        if (reportType === 'sales') return getVal(item, 'BookTitle').includes(term) || getVal(item, 'CategoryName').includes(term);
        if (reportType === 'customers') return getVal(item, 'FullName').includes(term) || getVal(item, 'Email').includes(term);
      }
      return true;
    });
  }, [data, search, activeTab, reportType]);

  return (
    <div className="app-layout">
      <aside className="sidebar glass-panel">
        <div className="logo-area">📚 BookStore DB</div>
        <nav className="nav-menu">
          <a href="#" className={activeTab === 'home' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('home'); }}>🏠 Головна</a>
          <a href="#" className={activeTab === 'books' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('books'); }}>📖 Книги</a>
          <a href="#" className={activeTab === 'orders' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('orders'); }}>📦 Замовлення</a>
          <a href="#" className={activeTab === 'users' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('users'); }}>👥 Користувачі</a>
          <a href="#" className={activeTab === 'reports' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('reports'); }}>📊 Звіти</a>
        </nav>
        <button onClick={async () => { await window.api.logout(); navigate("/login"); }} className="logout-btn">Вийти</button>
      </aside>

      <main className="content">
        <header className="top-bar glass-panel">
          {activeTab !== 'home' ? (
            <input
              type="text"
              placeholder={`Пошук...`}
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          ) : (
            <div className="greeting">Вітаємо у панелі керування! 👋</div>
          )}
          <button onClick={toggleTheme} className="theme-btn">🌗</button>
        </header>

        <div className="table-container glass-panel">
          <div className="table-header">
            <h2>{activeTab === 'home' ? 'Огляд системи' : activeTab.toUpperCase()}</h2>
            
            {/* Перемикач звітів з'являється тільки у вкладці Reports */}
            {activeTab === 'reports' && (
              <div className="report-toggle">
                <button 
                  className={reportType === 'sales' ? 'active' : ''} 
                  onClick={() => setReportType('sales')}
                >Книги (Продажі)</button>
                <button 
                  className={reportType === 'customers' ? 'active' : ''} 
                  onClick={() => setReportType('customers')}
                >Клієнти (Топ покупців)</button>
              </div>
            )}

            <button className={`refresh-btn ${isLoading ? 'loading' : ''}`} onClick={refreshData} disabled={isLoading}>
              <span className="icon">🔄</span> Оновити
            </button>
          </div>

          {isLoading ? (
            <div className="loader">Зчитування даних...</div>
          ) : activeTab === 'home' && statsData ? (
            <div className="dashboard-home fade-in">
              {/* Тут блок статистики з попереднього коду (залишається без змін) */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="title">Дохід (Загальний)</div>
                  <div className="value success">{statsData.totalRevenue} грн</div>
                </div>
                <div className="stat-card">
                  <div className="title">Очікують відправки</div>
                  <div className="value warning">{statsData.pendingOrders} шт.</div>
                </div>
                <div className="stat-card">
                  <div className="title">Клієнтів у базі</div>
                  <div className="value highlight">{statsData.totalUsers}</div>
                </div>
                <div className="stat-card">
                  <div className="title">Закінчуються (Склад &lt; 10)</div>
                  <div className="value danger">{statsData.lowStockBooks} книг</div>
                </div>
              </div>

              <div className="dashboard-tables">
                <div className="dash-box">
                  <h3>Топ-5 продаваних книг 🏆</h3>
                  <div className="dash-list">
                    {statsData.topBooks.map((b: any, idx: number) => (
                      <div key={b.Id} className="dash-item">
                        <span className="rank">#{idx + 1}</span>
                        <div className="info">
                          <b>{b.Title || b.title}</b>
                          <span>{b.Author || b.author}</span>
                        </div>
                        <span className="badge-sales">{b.TotalSold || b.totalsold || 0} шт.</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dash-box">
                  <h3>Останні замовлення 🕒</h3>
                  <div className="dash-list">
                    {statsData.recentOrders.map((o: any) => (
                      <div key={o.OrderID} className="dash-item">
                        <div className="info">
                          <b>#{o.OrderID} - {o.FullName || "Гість"}</b>
                          <span>{o.FinalAmount} грн</span>
                        </div>
                        <span className={`status-badge ${(o.Status || 'pending').toLowerCase()}`}>
                          {o.Status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="table-scroll fade-in">
              <table>
                <thead>
                  {activeTab === "books" && <tr><th>Книга / Автор</th><th>Ціна</th><th>Склад</th><th>Дії</th></tr>}
                  {activeTab === "orders" && <tr><th>ID</th><th>Клієнт</th><th>Сума</th><th>Статус</th><th>Дії</th></tr>}
                  {activeTab === "users" && <tr><th>ID</th><th>Ім'я</th><th>Email</th><th>Роль</th><th>Дії</th></tr>}
                  {/* Заголовки для різних звітів */}
                  {activeTab === "reports" && reportType === "sales" && <tr><th>Назва книги</th><th>Категорія</th><th>Продано (шт.)</th><th>Загальний дохід</th></tr>}
                  {activeTab === "reports" && reportType === "customers" && <tr><th>Ім'я клієнта</th><th>Email</th><th>К-сть замовлень</th><th>Сума покупок</th></tr>}
                </thead>
                <tbody>
                  {filteredData.length > 0 ? filteredData.map((item: any) => (
                    <tr key={item.Id || item.OrderID || item.UserID || item.BookTitle || item.FullName || Math.random()}>
                      {activeTab === "books" && (
                        <>
                          <td><b>{item.Title || item.title}</b><br/><small>{item.Author || item.author}</small></td>
                          <td>{item.Price || item.price} грн</td>
                          <td className={item.TotalStock > 0 ? "text-success" : "text-danger"}>{item.TotalStock ?? 0} шт</td>
                          <td><button onClick={() => handleAction("delete-book", item.Id || item.id)} className="btn-icon">🗑️</button></td>
                        </>
                      )}
                      {activeTab === "orders" && (
                        <>
                          <td>#{item.OrderID}</td>
                          <td>{item.FullName || "Гість"}</td>
                          <td>{item.FinalAmount} грн</td>
                          <td><span className={`status-badge ${(item.Status || "pending").toLowerCase()}`}>{item.Status}</span></td>
                          <td>
                            <select value={item.Status} onChange={(e) => handleAction("status-order", item.OrderID, e.target.value)} className="status-select">
                              <option value="Pending">Очікує</option>
                              <option value="Shipped">Відправлено</option>
                              <option value="Delivered">Доставлено</option>
                            </select>
                          </td>
                        </>
                      )}
                      {activeTab === "users" && (
                        <>
                          <td>{item.UserID}</td>
                          <td><b>{item.FullName}</b></td>
                          <td>{item.Email}</td>
                          <td><span className="role-badge">{item.Role}</span></td>
                          <td><button onClick={() => handleAction("delete-user", item.UserID)} className="btn-icon">🗑️</button></td>
                        </>
                      )}
                      {/* Тіло таблиці для різних звітів */}
                      {activeTab === "reports" && reportType === "sales" && (
                        <>
                          <td><b>{item.BookTitle}</b></td>
                          <td>{item.CategoryName}</td>
                          <td style={{ color: "#3b82f6", fontWeight: "bold" }}>{item.CopiesSold}</td>
                          <td className="text-success bold">{item.GeneratedRevenue} грн</td>
                        </>
                      )}
                      {activeTab === "reports" && reportType === "customers" && (
                        <>
                          <td><b>{item.FullName}</b></td>
                          <td>{item.Email}</td>
                          <td style={{ color: "#3b82f6", fontWeight: "bold" }}>{item.TotalOrders}</td>
                          <td className="text-success bold">{item.TotalSpent} грн</td>
                        </>
                      )}
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="empty-state">Даних не знайдено</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;