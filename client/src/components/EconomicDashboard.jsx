import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export default function EconomicDashboard() {
  const [activeTab, setActiveTab] = useState('balances');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

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

  const fetchTransactions = useCallback(async (userUuid) => {
    if (!userUuid) return;
    setLoading(true);
    try {
      const res = await api.getTransactions(userUuid);
      setTransactions(res.data || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchTransactions(selectedUser.uuid);
    }
  }, [selectedUser, fetchTransactions]);

  const totalPages = Math.ceil(total / limit);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border-b border-gray-200">
        <div className="flex gap-1 px-4 pt-4">
          <button
            onClick={() => {
              setActiveTab('balances');
              setSelectedUser(null);
            }}
            className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'balances'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🏦 可用資產 (Balances)
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setSelectedUser(null);
            }}
            className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📋 變動紀錄 (History)
          </button>
        </div>
      </div>

      {/* Balances Tab */}
      {activeTab === 'balances' && (
        <div>
          {/* Search Toolbar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="搜尋暱稱 / UUID / 手機號"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 whitespace-nowrap"
              >
                搜尋
              </button>
            </form>
          </div>

          {/* Balances Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">暱稱</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">UUID</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">
                      🎫 個人房卡
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">
                      🏢 俱樂部房卡
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">
                      🀄 番數
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">
                      ⭐ 積分
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">
                      🎁 道具倉庫
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                        載入中...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                        暫無資料
                      </td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">
                          {u.nickname}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap max-w-xs truncate">
                          {u.uuid}
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          <span className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-700 font-semibold">
                            {u.personal_room_cards || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          <span className="inline-block px-2 py-1 rounded bg-green-50 text-green-700 font-semibold">
                            {u.club_room_cards || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          <span className="inline-block px-2 py-1 rounded bg-purple-50 text-purple-700 font-semibold">
                            {u.faan || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          <span className="inline-block px-2 py-1 rounded bg-yellow-50 text-yellow-700 font-semibold">
                            {u.score || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          <span className="inline-block px-2 py-1 rounded bg-orange-50 text-orange-700 font-semibold">
                            {u.inventory || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            查看交易
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

          {/* User Details Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">
                    {selectedUser.nickname} - 資產詳情
                  </h2>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="px-6 py-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">🎫 個人房卡</div>
                      <div className="text-2xl font-bold text-blue-700">
                        {selectedUser.personal_room_cards || 0}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">🏢 俱樂部房卡</div>
                      <div className="text-2xl font-bold text-green-700">
                        {selectedUser.club_room_cards || 0}
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">🀄 番數</div>
                      <div className="text-2xl font-bold text-purple-700">
                        {selectedUser.faan || 0}
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">⭐ 積分</div>
                      <div className="text-2xl font-bold text-yellow-700">
                        {selectedUser.score || 0}
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg col-span-2">
                      <div className="text-sm text-gray-600">🎁 道具倉庫</div>
                      <div className="text-2xl font-bold text-orange-700">
                        {selectedUser.inventory || 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-2 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    關閉
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('history');
                    }}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    查看交易記錄
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          {selectedUser ? (
            <>
              {/* User Selection Bar */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm text-gray-500">當前查看用戶</div>
                    <div className="text-lg font-bold text-gray-800">
                      {selectedUser.nickname}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  返回列表
                </button>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">時間</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">交易ID</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">交易類型</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">貨幣類型</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">金額變動</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">交易後餘額</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">房間ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
                            載入中...
                          </td>
                        </tr>
                      ) : transactions.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
                            暫無交易記錄
                          </td>
                        </tr>
                      ) : (
                        transactions.map(t => (
                          <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-xs">
                              {new Date(t.created_at).toLocaleString('zh-HK')}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap font-mono max-w-xs truncate">
                              {t.trace_id}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  t.type === 'add'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {t.type === 'add' ? '新增' : '扣除'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                              <span className="px-2 py-1 rounded bg-gray-100 text-xs font-medium">
                                {t.currency_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`font-semibold ${
                                  t.amount > 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {t.amount > 0 ? '+' : ''}{t.amount}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-semibold">
                              {t.balance_after}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                              {t.room_id || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* User Selection List */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="text-gray-600 mb-3">請從下方選擇一個用戶查看交易記錄</div>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="搜尋暱稱 / UUID / 手機號"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 whitespace-nowrap"
                  >
                    搜尋
                  </button>
                </form>
              </div>

              {/* Users List for Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  <div className="col-span-full text-center py-8 text-gray-400">載入中...</div>
                ) : users.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-400">暫無用戶</div>
                ) : (
                  users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-200 text-left"
                    >
                      <div className="font-bold text-gray-800 mb-1">{u.nickname}</div>
                      <div className="text-xs text-gray-500 mb-3 truncate">{u.uuid}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-blue-50 p-2 rounded">
                          🎫 {u.personal_room_cards || 0}
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          🏢 {u.club_room_cards || 0}
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          🀄 {u.faan || 0}
                        </div>
                        <div className="bg-yellow-50 p-2 rounded">
                          ⭐ {u.score || 0}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Pagination for User List */}
              {!loading && users.length > 0 && (
                <div className="mt-4 flex justify-center gap-1">
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
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
