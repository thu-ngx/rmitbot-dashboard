import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge.tsx";
import { Package, MapPin } from "lucide-react";

interface DeliveryItem {
  productId: string;
  order: string;
  destination: string;
  status: "pending" | "in-transit" | "delivered";
}

interface DeliveryPanelProps {
  isConnected: boolean;
}

export function DeliveryPanel({ isConnected }: DeliveryPanelProps) {
  // Mock delivery data
  const deliveries: DeliveryItem[] = [
    {
      productId: "PKG-2501",
      order: "ORD-4891",
      destination: "Room A-204",
      status: "in-transit",
    },
    {
      productId: "PKG-2502",
      order: "ORD-4892",
      destination: "Room B-112",
      status: "pending",
    },
    {
      productId: "PKG-2503",
      order: "ORD-4893",
      destination: "Room C-305",
      status: "pending",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-transit":
        return "bg-blue-600";
      case "delivered":
        return "bg-green-600";
      default:
        return "bg-slate-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "in-transit":
        return "In Transit";
      case "delivered":
        return "Delivered";
      default:
        return "Pending";
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-100 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Delivery Queue
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="text-center py-8 text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-700" />
            <p className="text-sm">Connect robot to view delivery queue</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <div
                key={delivery.productId}
                className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800/70 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-300">
                      {delivery.productId}
                    </span>
                  </div>
                  <Badge
                    className={`text-xs ${getStatusColor(delivery.status)}`}
                  >
                    {getStatusText(delivery.status)}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-slate-500">Order:</span>
                    <span className="text-slate-300">{delivery.order}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-3 h-3" />
                    <span className="text-slate-300">
                      {delivery.destination}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
