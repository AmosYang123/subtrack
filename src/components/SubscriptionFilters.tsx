import React from 'react';
import { Form } from 'react-bootstrap';
import { Search, List, LayoutGrid, ArrowUpDown, X } from 'lucide-react';
import { useAppStore } from '../services/store';
import { CATEGORIES } from '../utils/catalog';

export const SubscriptionFilters: React.FC = () => {
  const { filters, setFilters, resetFilters } = useAppStore();

  const hasFilters = filters.searchTerm || filters.category !== 'all' || filters.status !== 'all' || filters.billingCycle !== 'all';

  return (
    <div className="filters-bar">
      <div className="input-with-icon" style={{ flex: '0 0 220px' }}>
        <span className="input-icon-lead">
          <Search size={14} />
        </span>
        <Form.Control
          type="text"
          placeholder="Search subscriptions..."
          value={filters.searchTerm}
          onChange={(e) => setFilters({ searchTerm: e.target.value })}
        />
      </div>

      <Form.Select
        style={{ width: 140, flex: 'none' }}
        value={filters.category}
        onChange={(e) => setFilters({ category: e.target.value })}
      >
        <option value="all">All categories</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </Form.Select>

      <Form.Select
        style={{ width: 120, flex: 'none' }}
        value={filters.status}
        onChange={(e) => setFilters({ status: e.target.value })}
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="cancelled">Cancelled</option>
      </Form.Select>

      <Form.Select
        style={{ width: 120, flex: 'none' }}
        value={filters.billingCycle}
        onChange={(e) => setFilters({ billingCycle: e.target.value })}
      >
        <option value="all">All cycles</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
        <option value="weekly">Weekly</option>
        <option value="quarterly">Quarterly</option>
      </Form.Select>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
        <Form.Select
          style={{ width: 130, flex: 'none' }}
          value={filters.sortBy}
          onChange={(e) => setFilters({ sortBy: e.target.value as any })}
        >
          <option value="nextBilling">By renewal</option>
          <option value="amount">By cost</option>
          <option value="name">By name</option>
        </Form.Select>

        <button
          className="btn-icon"
          onClick={() => setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
          title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        >
          <ArrowUpDown size={14} />
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

        <button
          className={`btn-icon ${filters.viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setFilters({ viewMode: 'table' })}
          style={filters.viewMode === 'table' ? { background: 'var(--bg-subtle)', color: 'var(--text)' } : undefined}
        >
          <List size={15} />
        </button>
        <button
          className={`btn-icon ${filters.viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setFilters({ viewMode: 'grid' })}
          style={filters.viewMode === 'grid' ? { background: 'var(--bg-subtle)', color: 'var(--text)' } : undefined}
        >
          <LayoutGrid size={15} />
        </button>

        {hasFilters && (
          <button className="btn-ghost" onClick={resetFilters} style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            <X size={13} /> Clear
          </button>
        )}
      </div>
    </div>
  );
};
