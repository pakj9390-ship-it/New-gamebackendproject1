import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import UserModal from './UserModal.jsx';
import StatsDashboard from './StatsDashboard.jsx';
import EconomicDashboard from './EconomicDashboard.jsx';

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toCSV(rows, columns) {
  const header = columns.map(c => `"${c.label}"`).join(',');
  const lines = rows.map(row =>
    columns.map(c => {
      const val = row[c.key] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  return '\uFEFF' + [header, ...lines].join('\n');
}

function toXLS(rows, columns) {
  let html = '<table border="1">';
  html += '<tr>' + columns.map(c => `<th>${c.label}</th>`).join('') + '</tr>';
  rows.forEach(row => {
    html += '<tr>' + columns.map(c => `<td>${row[c.key] ?? ''}</td>`).join('') + '</tr>';
  });
  html += '</table>';
  return html;
}

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getUsers(page, limit, search);
      setUsers(res.data);
      setTotal(res.total);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.ceil(total / limit);

  async function handleSave(data) {
    if (modalUser) {
      await api.updateUser(modalUser.id, data);
    } else {
      await api.createUser(data);
    }
    fetchUsers();
  }

  async function handleDelete(id) {
    if (!confirm('確定要刪除此用戶嗎？')) return;
    await api.deleteUser(id);
    fetchUsers();
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  }

  async function handleExportCSV() {
    try {
      const res = await api.exportUsers();
      const csv = toCSV(res.data, columns);
      downloadFile(csv, `users_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv;charset=utf-8;');
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleExportXLS() {
    try {
      const res = await api.exportUsers();
      const xls = toXLS(res.data, columns);
      downloadFile(xls, `users_${new Date().toISOString().slice(0,10)}.xls`, 'application/vnd.ms-excel;charset=utf-8;');
    } catch (err) {
      alert(err.message);
    }
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'uuid', label: 'UUID' },
    { key: 'nickname', label: '暱稱' },
    { key: 'phone', label: '手機號' },
    { key: 'exp', label: '經驗值' },
    { key: 'avatar_url', label: '頭像' },
    { key: 'personal_room_cards', label: '個人房卡' },
    { key: 'club_room_cards', label: '俱樂部房卡' },
    { key: 'faan', label: '番數' },
    { key: 'score', label: '積分' },
    { key: 'inventory', label: '道具倉庫' },
    { key: 'rank_tier', label: '段位' },
    { key: 'win_games', label: '勝場' },
    { key: 'total_games', label: '總局數' },
    { key: 'feed_games', label: '出銃' },
    { key: 'self_draw_games', label: '自摸' },
    { key: 'max_faan', label: '最高番' },
    { key: 'playstyle_tags', label: '風格' },
    { key: 'reputation_score', label: '信譽分' },
    { key: 'created_at', label: '創建時間' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gray-800">麻雀後台管理</h1>
            <nav className="flex gap-1">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'users'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                用戶管理
              </button>
              <button
                onClick={() => setActiveTab('economic')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'economic'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                經濟系統
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'stats'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                戰績統計
              </button>
            </nav>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50"
          >
            登出
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'users' ? (
          <>
            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="搜尋暱稱 / UUID / 手機號"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 whitespace-nowrap"
                >
                  搜尋
                </button>
              </form>
              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 whitespace-nowrap"
                >
                  匯出 CSV
                </button>
                <button
                  onClick={handleExportXLS}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 whitespace-nowrap"
                >
                  匯出 XLS
                </button>
                <button
                  onClick={() => setModalUser({})}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
                >
                  + 新增用戶
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {columns.map(c => (
                        <th key={c.key} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">
                          {c.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-400">載入中...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-400">暫無資料</td></tr>
                    ) : (
                      users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          {columns.map(c => (
                            <td key={c.key} className="px-4 py-3 text-gray-700 whitespace-nowrap max-w-xs truncate">
                              {u[c.key] ?? '-'}
                            </td>
                          ))}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => setModalUser(u)}
                              className="text-blue-600 hover:text-blue-800 mr-3"
                            >
                              編輯
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              刪除
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  共 {total} 筆，第 {page} / {totalPages || 1} 頁
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-40"
                  >
                    上一頁
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p;
                    if (totalPages <= 5) p = i + 1;
                    else if (page <= 3) p = i + 1;
                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 border rounded-md text-sm ${
                          p === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-40"
                  >
                    下一頁
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'economic' ? (
          <EconomicDashboard />
        ) : (
          <StatsDashboard />
        )}
      </main>

      {/* Modal */}
      {modalUser !== null && (
        <UserModal
          user={modalUser.id ? modalUser : null}
          onClose={() => setModalUser(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
