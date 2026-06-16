import { Search } from 'lucide-react';

const categories = ['All', 'Project engineering', 'Sales engineering', 'ASRS', 'Integration', 'IT Delivery', 'Installation', 'Test and Deployment', 'Other'];
const classifications = ['All', 'AI', 'Automation'];

export default function FilterBar({ filters, setFilters }) {
  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search ideas…"
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="input-field pl-11"
          />
        </div>

        {/* Category Filter */}
        <div className="relative sm:w-48">
          <select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="select-field"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Idea Type / Classification Filter — replaces old Status filter */}
        <div className="relative sm:w-44">
          <select
            value={filters.classification}
            onChange={(e) => handleChange('classification', e.target.value)}
            className="select-field"
          >
            {classifications.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Types' : c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
