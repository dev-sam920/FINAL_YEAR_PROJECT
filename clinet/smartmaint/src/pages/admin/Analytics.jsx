import React, { useEffect, useState } from 'react';
import {
  getAnalyticsOverview,
  getRequestsOverTime,
  getRevenueOverTime,
  getRequestsByCategory,
  getRequestsByStatus,
  getTopTechnicians,
  getCompletedGrowth,
} from '../../api/admin';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const BLUE = '#4285F4';
const GREEN = '#16A34A';
const ORANGE = '#F59E0B';

function StatCard({ title, value, icon }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F3F6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: BLUE, fontWeight: 800 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>{value}</div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [requestsSeries, setRequestsSeries] = useState([]);
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [topTechs, setTopTechs] = useState([]);
  const [growthData, setGrowthData] = useState(null);
  const [growthView, setGrowthView] = useState('weekly'); // 'weekly' | 'monthly'
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [ov, reqs, revs, cats, stats, top, growth] = await Promise.all([
        getAnalyticsOverview(),
        getRequestsOverTime(30),
        getRevenueOverTime(30),
        getRequestsByCategory(),
        getRequestsByStatus(),
        getTopTechnicians(),
        getCompletedGrowth(),
      ]);

      setOverview(ov);
      setRequestsSeries(reqs.series || []);
      setRevenueSeries(revs.series || []);
      setByCategory(cats.data || []);
      setByStatus(stats.data || []);
      setTopTechs(top.technicians || []);
      setGrowthData(growth || null);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 20, padding: '1rem 1.2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ color: BLUE, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Insights</div>
        <h1 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem' }}>Analytics</h1>
        <p style={{ margin: '0.25rem 0 0', color: '#6B7280' }}>Overview of key metrics and trends.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <StatCard title="Total Requests" value={loading ? '—' : (overview?.totalRequests ?? 0)} icon="R" />
        <StatCard title="Total Revenue (₦)" value={loading ? '—' : (overview?.totalRevenue ? `₦${overview.totalRevenue.toLocaleString()}` : '₦0')} icon="₦" />
        <StatCard title="Platform Fees (₦)" value={loading ? '—' : (overview?.totalPlatformFees ? `₦${overview.totalPlatformFees.toLocaleString()}` : '₦0')} icon="F" />
        <StatCard title="Active Technicians" value={loading ? '—' : (overview?.activeTechnicians ?? 0)} icon="T" />
        <StatCard title="Average Rating" value={loading ? '—' : (overview?.averageRequestRating ? `${overview.averageRequestRating} ★` : 'No ratings yet')} icon="★" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight: 700, color: '#111827', marginBottom: 8 }}>Requests Over Time (30 days)</div>
          {loading ? <div>Loading...</div> : (requestsSeries.length === 0 ? <div>No data yet</div> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={requestsSeries.map(s => ({ date: s.date, count: s.count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(t) => t.slice(5)} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke={BLUE} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ))}
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight: 700, color: '#111827', marginBottom: 8 }}>Revenue Over Time (30 days)</div>
          {loading ? <div>Loading...</div> : (revenueSeries.length === 0 ? <div>No data yet</div> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueSeries.map(s => ({ date: s.date, revenue: s.revenue }))}>
                <defs>
                  <linearGradient id="revg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GREEN} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickFormatter={(t) => t.slice(5)} />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke={GREEN} fill="url(#revg)" />
              </AreaChart>
            </ResponsiveContainer>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 12 }}>
        <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight: 700, color: '#111827', marginBottom: 8 }}>Requests by Category</div>
          {loading ? <div>Loading...</div> : (byCategory.length === 0 ? <div>No data yet</div> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byCategory} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={90} fill={BLUE} label>
                  {byCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={[BLUE, GREEN, ORANGE][index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 700, color: '#111827', marginBottom: 8 }}>Requests by Status</div>
            {loading ? <div>Loading...</div> : (byStatus.length === 0 ? <div>No data yet</div> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byStatus.map(s => ({ status: s.status, count: s.count }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="status" type="category" />
                  <Tooltip />
                  <Bar dataKey="count" fill={ORANGE} />
                </BarChart>
              </ResponsiveContainer>
            ))}
          </div>

          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 700, color: '#111827', marginBottom: 8 }}>Top Technicians</div>
            {loading ? <div>Loading...</div> : (topTechs.length === 0 ? <div>No data yet</div> : (
              <div style={{ display: 'grid', gap: 8 }}>
                {topTechs.map((t) => (
                  <div key={t.technicianId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F3F6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: BLUE, fontWeight: 800 }}>
                      {t.fullName ? t.fullName.split(' ').map(n=>n[0]).slice(0,2).join('') : 'T'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800 }}>{t.fullName || 'Unknown'}</div>
                      <div style={{ color: '#6B7280', fontSize: 13 }}>{t.avgRating != null ? `${Number(t.avgRating).toFixed(1)} ★ • ${t.completedCount} done` : `${t.completedCount} done`}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Growth section */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 700, color: '#111827' }}>Completed Requests Growth</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setGrowthView('weekly')} style={{ border: 'none', background: growthView === 'weekly' ? BLUE : '#F3F4F6', color: growthView === 'weekly' ? '#FFFFFF' : '#111827', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Weekly</button>
            <button type="button" onClick={() => setGrowthView('monthly')} style={{ border: 'none', background: growthView === 'monthly' ? BLUE : '#F3F4F6', color: growthView === 'monthly' ? '#FFFFFF' : '#111827', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Monthly</button>
          </div>
        </div>

        {loading ? <div>Loading...</div> : (!growthData ? <div>No growth data yet</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 12, alignItems: 'center' }}>
            <div style={{ height: 260 }}>
              {growthView === 'weekly' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(growthData.weekly.series || []).map(s => ({ label: s.weekStart.slice(5), count: s.count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={BLUE} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(growthData.monthly.series || []).map(s => ({ label: s.month, count: s.count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={BLUE} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {growthView === 'weekly' ? (
                <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>This week vs last week</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: growthData.weekly.weekOverWeekGrowth == null ? '#111827' : (growthData.weekly.weekOverWeekGrowth >= 0 ? GREEN : '#DC2626') }}>
                    {growthData.weekly.weekOverWeekGrowth == null ? 'N/A' : `${growthData.weekly.weekOverWeekGrowth}%`} {growthData.weekly.weekOverWeekGrowth > 0 ? '▲' : (growthData.weekly.weekOverWeekGrowth < 0 ? '▼' : '')}
                  </div>
                  <div style={{ color: '#6B7280' }}>{(growthData.weekly.series || []).slice(-1)[0]?.count || 0} completed this week</div>
                </div>
              ) : (
                <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>This month vs last month</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: growthData.monthly.monthOverMonthGrowth == null ? '#111827' : (growthData.monthly.monthOverMonthGrowth >= 0 ? GREEN : '#DC2626') }}>
                    {growthData.monthly.monthOverMonthGrowth == null ? 'N/A' : `${growthData.monthly.monthOverMonthGrowth}%`} {growthData.monthly.monthOverMonthGrowth > 0 ? '▲' : (growthData.monthly.monthOverMonthGrowth < 0 ? '▼' : '')}
                  </div>
                  <div style={{ color: '#6B7280' }}>{(growthData.monthly.series || []).slice(-1)[0]?.count || 0} completed this month</div>
                </div>
              )}

              <div style={{ color: '#6B7280', fontSize: 13 }}>Showing last 12 {growthView === 'weekly' ? 'weeks' : 'months'}. Data gaps are shown as zeroes.</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
