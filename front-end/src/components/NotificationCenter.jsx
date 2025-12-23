import { useState, useEffect } from "react";
import {
  Bell,
  Check,
  Trash2,
  Eye,
  FileText,
  Home,
  Wrench,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { toast } from "sonner";

/**
 * NotificationCenter - Trung tâm thông báo
 *
 * Component hiển thị:
 * - Icon bell với số thông báo chưa đọc
 * - Dropdown menu với danh sách thông báo gần nhất
 * - Dialog xem chi tiết thông báo
 * - Khả năng đánh dấu đã đọc, xóa thông báo
 */
export default function NotificationCenter() {
  // const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load notifications
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/notifications?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setNotifications(response.data.data.items || []);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/notifications/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setUnreadCount(response.data.data.unread_count || 0);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${
          import.meta.env.VITE_API_URL
        }/api/v1/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Reload notifications
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Không thể đánh dấu thông báo đã đọc");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/notifications/mark-all-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
      // toast({
      //   title: "Thành công",
      //   description: "Đã đánh dấu tất cả thông báo là đã đọc",
      // });

      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Không thể đánh dấu thông báo");
      // toast({
      //   title: "Lỗi",
      //   description: "Không thể đánh dấu thông báo",
      //   variant: "destructive",
      // });
    }
  };

  const handleViewDetail = (notification) => {
    setSelectedNotification(notification);
    setIsDetailOpen(true);
    setIsOpen(false);

    // Mark as read if unread
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${
          import.meta.env.VITE_API_URL
        }/api/v1/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast("Đã xóa thông báo");
      // toast({
      //   title: "Thành công",
      //   description: "Đã xóa thông báo",
      // });

      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Không thể xóa thông báo");
      // toast({
      //   title: "Lỗi",
      //   description: "Không thể xóa thông báo",
      //   variant: "destructive",
      // });
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      INVOICE: <FileText className="h-5 w-5 text-blue-600" />,
      CONTRACT: <Home className="h-5 w-5 text-green-600" />,
      MAINTENANCE: <Wrench className="h-5 w-5 text-orange-600" />,
      APPOINTMENT: <Calendar className="h-5 w-5 text-purple-600" />,
      SYSTEM: <Bell className="h-5 w-5 text-gray-600" />,
    };
    return icons[type] || <Bell className="h-5 w-5 text-gray-600" />;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN");
  };

  return (
    <>
      {/* Bell Icon with Badge */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[380px] max-h-[500px] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold">Thông báo</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Không có thông báo</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.is_read ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleViewDetail(notification)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDateTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotification &&
                getNotificationIcon(selectedNotification.type)}
              {selectedNotification?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedNotification &&
                formatDateTime(selectedNotification.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm whitespace-pre-wrap">
                  {selectedNotification.content}
                </p>
              </div>

              <div className="flex gap-2">
                {!selectedNotification.is_read && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleMarkAsRead(selectedNotification.id);
                      setIsDetailOpen(false);
                    }}
                    className="flex-1"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Đánh dấu đã đọc
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteNotification(selectedNotification.id);
                    setIsDetailOpen(false);
                  }}
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
