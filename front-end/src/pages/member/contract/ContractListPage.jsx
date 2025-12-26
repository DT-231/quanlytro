import React, { useState, useEffect } from "react";
import { contractService } from "@/services/contractService";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  NoSymbolIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";

const ContractListPage = () => {
  const { refreshUser } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(false);

  // Refresh user info khi vào trang để đồng bộ role nếu có thay đổi
  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      try {
        const params = status === "ALL" ? {} : { status };
        const response = await contractService.getAll(params);

        setContracts(response.data.items);
      } catch (error) {
        console.error("Error fetching contracts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [status]);

  const TABS = [
    { label: "Tất cả", value: "ALL", icon: DocumentTextIcon },
    { label: "Hoạt động", value: "ACTIVE", icon: CheckCircleIcon },
    { label: "Chờ ký", value: "PENDING", icon: ClockIcon },
    { label: "Hết hạn", value: "EXPIRED", icon: NoSymbolIcon },
    { label: "Đã hủy", value: "TERMINATED", icon: XCircleIcon },
  ];

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "PENDING":
        return "warning";
      case "EXPIRED":
        return "secondary";
      case "TERMINATED":
        return "destructive";
      case "TERMINATION_REQUESTED_BY_LANDLORD":
        return "warning";
      default:
        return "outline";
    }
  };
  const getStatusText = (status) => {
    switch (status) {
      case "ACTIVE":
        return "Hoạt động";
      case "PENDING":
        return "Chờ ký";
      case "EXPIRED":
        return "Hết hạn";
      case "TERMINATED":
        return "Đã hủy";
      case "TERMINATION_REQUESTED_BY_LANDLORD":
        return "Yêu cầu chấm dứt hợp đồng";
      default:
        return "Không rõ";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Hợp đồng của tôi
        </h1>

        <Card className="p-4">
          <CardHeader className="px-0">
            <CardTitle>Danh sách hợp đồng</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Tabs defaultValue="ALL" onValueChange={setStatus}>
              {/* Tabs với scroll ngang trên mobile */}
              <div className="overflow-x-auto pb-2 -mx-2 px-2">
                <TabsList className="inline-flex w-auto min-w-full sm:w-full sm:grid sm:grid-cols-5 gap-1 sm:gap-2">
                  {TABS.map(({ label, value, icon }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className={
                        value === "ACTIVE"
                          ? "data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:border-green-600 hover:bg-green-50"
                          : ""
                      }
                    >
                      <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                        {React.createElement(icon, {
                          className: "w-4 h-4 sm:w-5 sm:h-5 shrink-0",
                        })}
                        <span className="text-xs sm:text-sm">{label}</span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <TabsContent value={status}>
                {loading ? (
                  <div className="text-center p-8">
                    <p>Đang tải danh sách hợp đồng...</p>
                  </div>
                ) : contracts.length > 0 ? (
                  <div className="mt-4 space-y-4 flex flex-col gap-2">
                    {contracts.map((contract) => (
                      <Link
                        to={`/member/my-contracts/${contract.id}`}
                        key={contract.id}
                      >
                        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4 p-4 rounded-lg border hover:bg-gray-100 transition-colors">
                          <Avatar>
                            <AvatarImage
                              src={
                                contract.building_image_url ||
                                "https://via.placeholder.com/150"
                              }
                              alt={contract.building_name}
                            />
                            <AvatarFallback>
                              {contract.building_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="font-semibold text-blue-gray">
                              {`Hợp đồng phòng ${contract.room_number} - ${contract.building_name}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {`Ngày bắt đầu: ${new Date(
                                contract.start_date
                              ).toLocaleDateString()}`}
                            </p>
                          </div>
                          <Badge
                            variant={getStatusBadgeVariant(contract.status)}
                          >
                            {getStatusText(contract.status)}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 mt-4 border rounded-lg">
                    <p>Không tìm thấy hợp đồng nào với trạng thái này.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContractListPage;
