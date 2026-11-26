
import { useState } from 'react'
import './App.css'

const API = '/api'

function App() {
  const [login, setLogin] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [token, setToken] = useState('')
  const [clients, setClients] = useState([])
  const [deals, setDeals] = useState([])
  const [showDealForm, setShowDealForm] = useState(false)
  const [editingDealId, setEditingDealId] = useState(null)

const [dealForm, setDealForm] = useState({
  title: '',
  client_id: '',
  amount: '',
  status: 'Новая'
})
  const [activePage, setActivePage] = useState('clients')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [dealSearch, setDealSearch] = useState('')

  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: ''
  })

  async function loadClients(authToken) {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API}/clients`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка загрузки клиентов')
      }

      setClients(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(event) {
  event.preventDefault()
  setError('')
  setLoading(true)

  try {
    const response = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ login, password })
    })

    const data = await response.json()

    if (!response.ok || !data.token) {
      throw new Error(data.message || 'Неверный логин или пароль')
    }

    setToken(data.token)
    await loadClients(data.token)
    await loadDeals(data.token)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

async function loadDeals(authToken) {
  try {
    const response = await fetch(`${API}/deals`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Не удалось загрузить сделки')
    }

    setDeals(Array.isArray(data) ? data : data.deals || [])
  } catch (err) {
    setError(err.message)
  }
}

async function addDeal(event) {
  event.preventDefault()
  setError('')

  try {
    const response = await fetch(`${API}/deals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...dealForm,
        client_id: Number(dealForm.client_id),
        amount: Number(dealForm.amount)
      })
    })

    const data = await response.json()

    if (!response.ok) {
  throw new Error(data.error || data.message || 'Не удалось добавить сделку')
}

setSuccessMessage('Сделка успешно добавлена!')

    setDealForm({
      title: '',
      client_id: '',
      amount: '',
      status: 'Новая'
    })

    setShowDealForm(false)
    await loadDeals(token)
  } catch (err) {
    setError(err.message)
  }
}
    async function addClient(event) {
    event.preventDefault()
    setError('')

    try {
      const isEditing = editingId !== null

      const response = await fetch(
        isEditing
          ? `${API}/clients/${editingId}`
          : `${API}/clients`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(form)
        }
      )

      const data = await response.json()

     if (!response.ok) {
  throw new Error(data.message || 'Не удалось сохранить клиента')
}

setSuccessMessage(
  isEditing
    ? 'Клиент успешно изменён!'
    : 'Клиент успешно добавлен!'
)

      setForm({
        name: '',
        phone: '',
        email: '',
        company: ''
      })

      setEditingId(null)
setShowForm(false)
await loadClients(token)
    } catch (err) {
      setError(err.message)
    }
  }
  function startEditDeal(deal) {
  setEditingDealId(deal.id)

  setDealForm({
    title: deal.title || '',
    client_id: String(deal.client_id || ''),
    amount: String(deal.amount || ''),
    status: deal.status || 'Новая'
  })

  setShowDealForm(true)
}
async function editDeal(event) {
  event.preventDefault()
  setError('')

  try {
    const response = await fetch(`${API}/deals/${editingDealId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...dealForm,
        client_id: Number(dealForm.client_id),
        amount: Number(dealForm.amount)
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Не удалось изменить сделку')
    }
setSuccessMessage('Сделка успешно изменена!')
    setDealForm({
      title: '',
      client_id: '',
      amount: '',
      status: 'Новая'
    })

    setEditingDealId(null)
    setShowDealForm(false)
    await loadDeals(token)
  } catch (err) {
    setError(err.message)
  }
}

    function editClient(client) {
    setEditingId(client.id)

    setForm({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      company: client.company || ''
    })

    setShowForm(true)
  }

  async function deleteClient(id) {
    const confirmed = window.confirm('Вы действительно хотите удалить этого клиента?')

    if (!confirmed) return

    try {
      const response = await fetch(`${API}/clients/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось удалить клиента')
      }

      setSuccessMessage('Клиент успешно удалён!')
await loadClients(token)
    } catch (err) {
      setError(err.message)
    }
  }
async function deleteDeal(id) {
  const confirmed = window.confirm('Вы действительно хотите удалить сделку?')

  if (!confirmed) return

  try {
    const response = await fetch(`${API}/deals/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Не удалось удалить сделку')
    }
setSuccessMessage('Сделка успешно удалена!')
    await loadDeals(token)
  } catch (err) {
    setError(err.message)
  }
}
  function logout() {
    setToken('')
    setClients([])
    setPassword('admin123')
    setShowForm(false)
  }

  if (!token) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <h1>CRM-System</h1>
          <p>Вход в систему управления клиентами</p>

          <label>Логин</label>
          <input
            value={login}
            onChange={e => setLogin(e.target.value)}
            placeholder="Введите логин"
          />

          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Введите пароль"
          />

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Выполняется вход...' : 'Войти'}
          </button>

          <small>Тестовый доступ: admin / admin123</small>
        </form>
      </div>
    )
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="logo">CRM<span>System</span></h2>
        <p className="menu-title">МЕНЮ</p>
        <button
  className={`menu-item ${activePage === 'clients' ? 'active' : ''}`}
  onClick={() => setActivePage('clients')}
>
  👥 Клиенты
</button>

<button
  className={`menu-item ${activePage === 'deals' ? 'active' : ''}`}
  onClick={() => setActivePage('deals')}
>
  📊 Сделки
</button>

        <div className="sidebar-bottom">
          <div className="avatar">А</div>
          <div>
            <strong>Администратор</strong>
            <p>Управление CRM</p>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{activePage === 'clients' ? 'Клиенты' : 'Сделки'}</h1>
<p>
  {activePage === 'clients'
    ? 'Управление клиентской базой'
    : 'Управление сделками'}
</p>
          </div>

          <button className="logout-button" onClick={logout}>
            Выйти
          </button>
        </header>

        <section className="content">
          {successMessage && (
  <p className="success-message">{successMessage}</p>
)}
          <div className="welcome">
            <div>
              <h2>Рабочая панель CRM</h2>
              <p>{activePage === 'clients'
  ? 'Все ваши клиенты в одном месте'
  : 'Все ваши сделки в одном месте'}</p>
            </div>
            <span>CRM</span>
          </div>

          <div className="stats">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <p>{activePage === 'clients' ? 'Всего клиентов' : 'Всего сделок'}</p>
              <h2>{activePage === 'clients' ? clients.length : deals.length}</h2>
            </div>
          </div>

          {activePage === 'clients' && (
          <div className="table-card">
           <div className="table-heading">
  <div>
    <h2>Список клиентов</h2>
    <p>Управление клиентской базой</p>
    <input
  type="text"
  placeholder="Поиск клиента..."
  value={clientSearch}
  onChange={e => setClientSearch(e.target.value)}
/>
  </div>

              <div>
                <button
                  className="add-button"
                 onClick={() => {
  setEditingId(null)
  setForm({ name: '', phone: '', email: '', company: '' })
  setShowForm(true)
}}
                >
                  + Добавить клиента
                </button>

                <button
                  className="add-button"
                  onClick={() => loadClients(token)}
                >
                  ↻ Обновить
                </button>
              </div>
            </div>

            {error && <p className="error">{error}</p>}

            {showForm && (
              <form className="client-form" onSubmit={addClient}>
                <h2>{editingId !== null ? 'Редактирование клиента' : 'Новый клиент'}</h2>

                <label>Имя клиента *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Например, Иван Иванов"
                />

                <label>Телефон</label>
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="Введите телефон"
                />

                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="Введите email"
                />

                <label>Компания</label>
                <input
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  placeholder="Название компании"
                />
<button type="submit" className="add-button">
  {editingId !== null ? 'Сохранить изменения' : 'Сохранить клиента'}
</button>

                <button
                  type="button"
                  className="logout-button"
                  onClick={() => setShowForm(false)}
                >
                  Отмена
                </button>
              </form>
            )}

            {loading ? (
  <p className="empty-state">Загрузка данных...</p>
) : clients.length === 0 ? (
  <p className="empty-state">Клиентов пока нет</p>
) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Имя</th>
                      <th>Телефон</th>
                      <th>Email</th>
                      <th>Компания</th>
                      <th>Действия</th>
                    </tr>
                  </thead>

                  <tbody>
 {clients
  .filter(client =>
    `${client.name} ${client.phone} ${client.email} ${client.company}`
      .toLowerCase()
      .includes(clientSearch.toLowerCase())
  )
  .map(client => (
    <tr key={client.id}>
      <td>{client.id}</td>
      <td>{client.name}</td>
      <td>{client.phone}</td>
      <td>{client.email}</td>
      <td>{client.company}</td>

      <td>
        <button
          className="add-button"
          onClick={() => editClient(client)}
        >
          Редактировать
        </button>

        <button
          className="logout-button"
          onClick={() => deleteClient(client.id)}
        >
          Удалить
        </button>
      </td>
    </tr>
  ))}

                  </tbody>
                  
                </table>
              </div>
            )}
          </div>
          )}
        {activePage === 'deals' && (
  <div className="table-card">
    <div className="table-heading">
      <div>
        <h2>Список сделок</h2>
        <p>Управление сделками с клиентами</p>
      
<input
  type="text"
  placeholder="Поиск сделки..."
  value={dealSearch}
  onChange={e => setDealSearch(e.target.value)}
/>
      </div>

      <button
  className="add-button"
  onClick={() => {
    setEditingDealId(null)
    setDealForm({
      title: '',
      client_id: '',
      amount: '',
      status: 'Новая'
    })
    setShowDealForm(true)
  }}
>
  + Добавить сделку
</button>
    </div>
    {showDealForm && (
      <form
  className="client-form"
  onSubmit={editingDealId !== null ? editDeal : addDeal}
>

        <h2>{editingDealId !== null ? 'Редактирование сделки' : 'Новая сделка'}</h2>

        <label>Название сделки *</label>
        <input
          required
          value={dealForm.title}
          onChange={e => setDealForm({ ...dealForm, title: e.target.value })}
          placeholder="Например, Разработка сайта"
        />

        <label>Клиент *</label>
        <select
          required
          value={dealForm.client_id}
          onChange={e => setDealForm({ ...dealForm, client_id: e.target.value })}
        >
          <option value="">Выберите клиента</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>

        <label>Сумма *</label>
        <input
          type="number"
          min="0"
          step="0.01"
          required
          value={dealForm.amount}
          onChange={e => setDealForm({ ...dealForm, amount: e.target.value })}
          placeholder="Введите сумму"
        />

        <label>Статус</label>
        <select
          value={dealForm.status}
          onChange={e => setDealForm({ ...dealForm, status: e.target.value })}
        >
          <option value="Новая">Новая</option>
          <option value="В работе">В работе</option>
          <option value="Завершена">Завершена</option>
        </select>

        <button type="submit" className="add-button">
        {editingDealId !== null ? 'Сохранить изменения' : 'Сохранить сделку'}
        </button>

        <button
          type="button"
          className="logout-button"
          onClick={() => setShowDealForm(false)}
        >
          Отмена
        </button>
      </form>
    )}
    {deals.length === 0 ? (
  <p className="empty-state">Сделок пока нет</p>
) : (
  <div className="table-scroll">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Название сделки</th>
          <th>Клиент</th>
          <th>Сумма</th>
          <th>Статус</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
 {deals
  .filter(deal =>
    `${deal.title} ${deal.client_name} ${deal.status}`
      .toLowerCase()
      .includes(dealSearch.toLowerCase())
  )
  .map(deal => (
    <tr key={deal.id}>
      <td>{deal.id}</td>
      <td>{deal.title}</td>
      <td>{deal.client_name}</td>
      <td>{deal.amount}</td>
      <td>
  <span className={`status-badge ${
  deal.status === 'Новая'
    ? 'new'
    : deal.status === 'В работе'
      ? 'in-progress'
      : 'completed'
}`}>
  {deal.status}
</span>
</td>
      <td>
  <button
    className="add-button"
    onClick={() => startEditDeal(deal)}
  >
    Редактировать
  </button>

  <button
    className="logout-button"
    onClick={() => deleteDeal(deal.id)}
  >
    Удалить
  </button>
</td>
    </tr>
  ))}
</tbody>
    </table>
  </div>
)}
  </div>
)}
        </section>
      </main>
    </div>
  )
}

export default App
