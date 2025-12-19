import { useState, useEffect } from "react";
import { userService } from "@/services/userService";

export function useTenantSearch(tenants) {
  const [tenantQuery, setTenantQuery] = useState('');
  const [tenantSearchResults, setTenantSearchResults] = useState([]);

  useEffect(() => {
    if (!tenantQuery) {
      setTenantSearchResults(tenants);
      return;
    }

    const searchTenants = async () => {
      try {
        const res = await userService.getAll({ 
          size: 50, 
          role_code: "TENANT",
          search: tenantQuery
        });

        if (res?.data?.items) setTenantSearchResults(res.data.items);
        else if (res?.items) setTenantSearchResults(res.items);
        else setTenantSearchResults([]);
      } catch (error) {
        console.error("Lỗi tìm kiếm người thuê:", error);
        const filtered = tenants.filter((tenant) => {
          const searchStr = `${tenant.full_name} ${tenant.phone || ''} ${tenant.email || ''}`.toLowerCase();
          return searchStr.includes(tenantQuery.toLowerCase());
        });
        setTenantSearchResults(filtered);
      }
    };

    const timeoutId = setTimeout(searchTenants, 300);
    return () => clearTimeout(timeoutId);
  }, [tenantQuery, tenants]);

  return { tenantQuery, setTenantQuery, tenantSearchResults, setTenantSearchResults };
}
