import { useState, useEffect } from 'react';

const FIELDS = [
  { key: 'nickname', label: '暱稱', type: 'text', required: true },
  { key: 'uuid', label: 'UUID', type: 'text' },
  { key: 'avatar_url', label: '頭像 URL', type: 'text' },
  { key: 'phone', label: '手機號', type: 'text' },
  { key: 'exp', label: '經驗值', type: 'number' },
  { key: 'personal_room_cards', label: '個人房卡', type: 'number' },
  { key: 'club_room_cards', label: '俱樂部房卡', type: 'number' },
  { key: 'faan', label: '番數', type: 'number' },
  { key: 'score', label: '積分', type: 'number' },
  { key: 'inventory', label: '道具倉庫', type: 'number' },
  { key: 'rank_tier', label: '段位', type: 'text' },
  { key: 'win_games', label: '勝場', type: 'number' },
  { key: 'total_games', label: '總局數', type: 'number' },
  { key: 'feed_games', label: '出銃次數', type: 'number' },
  { key: 'self_draw_games', label: '自摸次數', type: 'number' },
  { key: 'max_faan', label: '最高番數', type: 'number' },
  { key: 'playstyle_tags', label: '玩家風格', type: 'text' },
  { key: 'reputation_score', label: '信譽分', type: 'number' }
];

export default function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const init = {};
      FIELDS.forEach(f => init[f.key] = user[f.key] ?? '');
      setForm(init);
    } else {
      const init = {};
      FIELDS.forEach(f => init[f.key] = f.type === 'number' ? 0 : '');
      setForm(init);
    }
  }, [user]);

  function handleChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {};
      FIELDS.forEach(f => {
        let v = form[f.key];
        if (f.type === 'number') v = parseInt(v) || 0;
        payload[f.key] = v;
      });
      await onSave(payload);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">{user ? '編輯用戶' : '新增用戶'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {f.label}{f.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={f.type}
                value={form[f.key] ?? ''}
                onChange={e => handleChange(f.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={f.required}
              />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '儲存中...' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
