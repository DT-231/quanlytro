const RoomSearchForm = ({ filters, setFilters }) => {
  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Khoảng giá (vd: 1500000-2500000)"
          value={filters.priceRange}
          onChange={(e) =>
            setFilters({ ...filters, priceRange: e.target.value })
          }
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Số người"
          value={filters.capacity}
          onChange={(e) => setFilters({ ...filters, capacity: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Khu vực (quận)"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          className="border p-2 rounded"
        />
      </div>
    </div>
  );
};

export default RoomSearchForm;
