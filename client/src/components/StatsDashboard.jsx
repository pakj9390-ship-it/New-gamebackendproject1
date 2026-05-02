import { useState, useEffect } from 'react';
import { api } from '../api';

function StatCard({ title, value, subtext, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    rose: 'bg-rose-50 border-rose-200 text-rose-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-800',
  };
  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color] || colorClasses.blue}`}>
      <p className="text-sm opacity-80">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtext && <p className="text-xs opacity-70 mt-1">{subtext}</p>}
    </div>
  );
}

function BarChart({ data, title }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-16 truncate">{item.label}</span>
            <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PercentageBar({ data, title }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-16 truncate">{item.label}</span>
            <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-12 text-right">
              {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await api.getUsers(1, 1000, '');
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">載入統計資料中...</div>;
  if (users.length === 0) return <div className="p-8 text-center text-gray-400">暫無資料</div>;

  // Calculations
  const totalUsers = users.length;
  const totalGames = users.reduce((s, u) => s + (u.total_games || 0), 0);
  const totalFaan = users.reduce((s, u) => s + (u.faan || 0), 0);
  const totalScore = users.reduce((s, u) => s + (u.score || 0), 0);
  const avgReputation = (users.reduce((s, u) => s + (u.reputation_score || 0), 0) / totalUsers).toFixed(1);

  const totalWins = users.reduce((s, u) => s + (u.win_games || 0), 0);
  const totalFeeds = users.reduce((s, u) => s + (u.feed_games || 0), 0);
  const totalSelfDraws = users.reduce((s, u) => s + (u.self_draw_games || 0), 0);

  const overallWinRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : 0;
  const overallFeedRate = totalGames > 0 ? ((totalFeeds / totalGames) * 100).toFixed(1) : 0;
  const overallSelfDrawRate = totalGames > 0 ? ((totalSelfDraws / totalGames) * 100).toFixed(1) : 0;

  // Rank distribution
  const rankCounts = {};
  users.forEach(u => {
    const tier = u.rank_tier || '未知';
    rankCounts[tier] = (rankCounts[tier] || 0) + 1;
  });
  const rankData = Object.entries(rankCounts).map(([label, value]) => ({ label, value }));

  // Playstyle distribution
  const styleCounts = {};
  users.forEach(u => {
    let tags = u.playstyle_tags || '[]';
    try {
      tags = JSON.parse(tags);
    } catch {
      tags = [tags.replace(/[\[\]"]/g, '')];
    }
    if (!Array.isArray(tags)) tags = [tags];
    tags.forEach(tag => {
      const t = tag || '未知';
      styleCounts[t] = (styleCounts[t] || 0) + 1;
    });
  });
  const styleData = Object.entries(styleCounts).map(([label, value]) => ({ label, value }));

  // Max faan leaderboard
  const faanLeaderboard = [...users]
    .sort((a, b) => (b.max_faan || 0) - (a.max_faan || 0))
    .slice(0, 5)
    .map(u => ({ label: u.nickname, value: u.max_faan || 0 }));

  // Top players by wins
  const winLeaderboard = [...users]
    .sort((a, b) => (b.win_games || 0) - (a.win_games || 0))
    .slice(0, 5)
    .map(u => ({ label: u.nickname, value: u.win_games || 0 }));

  // Top players by score
  const scoreLeaderboard = [...users]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5)
    .map(u => ({ label: u.nickname, value: u.score || 0 }));

  // Inventory distribution
  const totalInventory = users.reduce((s, u) => s + (u.inventory || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard title="總用戶數" value={totalUsers} color="blue" />
        <StatCard title="總對局數" value={totalGames.toLocaleString()} color="green" />
        <StatCard title="總番數" value={totalFaan.toLocaleString()} color="amber" />
        <StatCard title="總積分" value={totalScore.toLocaleString()} color="rose" />
        <StatCard title="平均信譽分" value={avgReputation} color="purple" />
        <StatCard title="整體食糊率" value={`${overallWinRate}%`} subtext={`${totalWins} 場勝利`} color="cyan" />
        <StatCard title="整體出銃率" value={`${overallFeedRate}%`} subtext={`${totalFeeds} 次出銃`} color="rose" />
        <StatCard title="整體自摸率" value={`${overallSelfDrawRate}%`} subtext={`${totalSelfDraws} 次自摸`} color="green" />
        <StatCard title="道具總量" value={totalInventory.toLocaleString()} color="amber" />
        <StatCard title="活躍玩家" value={users.filter(u => (u.total_games || 0) > 0).length} color="blue" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PercentageBar data={rankData} title="段位分佈" />
        <PercentageBar data={styleData} title="玩家風格分佈" />
        <BarChart data={faanLeaderboard} title="最高番數排行榜 (Top 5)" />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BarChart data={winLeaderboard} title="勝場排行榜 (Top 5)" />
        <BarChart data={scoreLeaderboard} title="積分排行榜 (Top 5)" />
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">玩家戰績詳情</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">暱稱</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">段位</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">總局數</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">勝場</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">食糊率</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">出銃</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">出銃率</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">自摸</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">自摸率</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">最高番</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">風格</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => {
                const games = u.total_games || 0;
                const winRate = games > 0 ? (((u.win_games || 0) / games) * 100).toFixed(1) : '0.0';
                const feedRate = games > 0 ? (((u.feed_games || 0) / games) * 100).toFixed(1) : '0.0';
                const selfDrawRate = games > 0 ? (((u.self_draw_games || 0) / games) * 100).toFixed(1) : '0.0';
                let tags = u.playstyle_tags || '-';
                try {
                  const parsed = JSON.parse(tags);
                  tags = Array.isArray(parsed) ? parsed.join(', ') : parsed;
                } catch {
                  tags = tags.replace(/[\[\]"]/g, '');
                }
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{u.nickname}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        u.rank_tier === '雀神' ? 'bg-amber-100 text-amber-700' :
                        u.rank_tier === '雀傑' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {u.rank_tier || '初學者'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">{games}</td>
                    <td className="px-4 py-2 text-right">{u.win_games || 0}</td>
                    <td className="px-4 py-2 text-right">{winRate}%</td>
                    <td className="px-4 py-2 text-right">{u.feed_games || 0}</td>
                    <td className="px-4 py-2 text-right text-rose-600">{feedRate}%</td>
                    <td className="px-4 py-2 text-right">{u.self_draw_games || 0}</td>
                    <td className="px-4 py-2 text-right text-green-600">{selfDrawRate}%</td>
                    <td className="px-4 py-2 text-right font-semibold">{u.max_faan || 0}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{tags}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
