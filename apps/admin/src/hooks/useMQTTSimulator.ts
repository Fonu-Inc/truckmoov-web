import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

export type SimulatedDevice = {
  id: string;
  imei: string;
  name: string;
  status: "disconnected" | "connecting" | "connected" | "error";
  manufacturer: string;
  model: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  fuel: number;
  battery: number;
  lastMessage?: string;
  messageCount: number;
  errorCount: number;
  insideGeofences: string[];
};

export type MessageLog = {
  id: string;
  timestamp: Date;
  deviceImei: string;
  direction: "sent" | "received";
  topic: string;
  payload: any;
  type: string;
};

export type ConnectionStats = {
  totalConnections: number;
  activeConnections: number;
  messagesSent: number;
  messagesReceived: number;
  errorsCount: number;
  bytesTransferred: number;
  avgLatency: number;
  messagesPerSecond: number;
};

export type GeofenceZone = {
  id: string;
  name: string;
  center: {
    lat: number;
    lng: number;
  };
  radius: number;
  type: "restricted" | "delivery" | "parking" | "warehouse";
  color: string;
};

export type GeofenceAlert = {
  id: string;
  timestamp: Date;
  deviceImei: string;
  deviceName: string;
  geofenceName: string;
  geofenceType: string;
  alertType: "entry" | "exit";
  latitude: number;
  longitude: number;
};

const LAGOS_CENTER = {
  lat: 6.5244,
  lng: 3.3792,
};

// Predefined geofence zones around Lagos
export const GEOFENCE_ZONES: GeofenceZone[] = [
  {
    id: "geo-1",
    name: "Victoria Island Hub",
    center: {
      lat: 6.4281,
      lng: 3.4219,
    },
    radius: 500,
    type: "warehouse",
    color: "#3b82f6",
  },
  {
    id: "geo-2",
    name: "Ikeja Depot",
    center: {
      lat: 6.6018,
      lng: 3.3515,
    },
    radius: 400,
    type: "warehouse",
    color: "#22c55e",
  },
  {
    id: "geo-3",
    name: "Lekki Free Zone",
    center: {
      lat: 6.4698,
      lng: 3.5852,
    },
    radius: 800,
    type: "delivery",
    color: "#f59e0b",
  },
  {
    id: "geo-4",
    name: "Apapa Port Restricted",
    center: {
      lat: 6.4483,
      lng: 3.3589,
    },
    radius: 600,
    type: "restricted",
    color: "#ef4444",
  },
  {
    id: "geo-5",
    name: "Lagos Island Parking",
    center: {
      lat: 6.4541,
      lng: 3.3947,
    },
    radius: 300,
    type: "parking",
    color: "#8b5cf6",
  },
  {
    id: "geo-6",
    name: "Surulere Zone",
    center: {
      lat: 6.5059,
      lng: 3.3509,
    },
    radius: 450,
    type: "delivery",
    color: "#06b6d4",
  },
];

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a
    = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos((lat1 * Math.PI) / 180)
      * Math.cos((lat2 * Math.PI) / 180)
      * Math.sin(dLng / 2)
      * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a),
  );
  return R * c;
}

// Check if a point is inside a geofence
function isInsideGeofence(lat: number, lng: number, geofence: GeofenceZone): boolean {
  const distance = calculateDistance(
    lat,
    lng,
    geofence.center.lat,
    geofence.center.lng,
  );
  return distance <= geofence.radius;
}

// Generate random device data
function generateRandomDevice(index: number): SimulatedDevice {
  const manufacturers = [
    "Teltonika",
    "Queclink",
    "Concox",
    "Ruptela",
    "CalAmp",
  ];
  const models = {
    Teltonika: [
      "FMC130",
      "FMB920",
      "FMB140",
      "FMC640",
    ],
    Queclink: [
      "GV300",
      "GV500",
      "GL300",
      "GV55",
    ],
    Concox: [
      "GT06N",
      "JM-VL03",
      "X3",
    ],
    Ruptela: [
      "FM-Eco4",
      "FM-Pro4",
      "HCV5",
    ],
    CalAmp: [
      "LMU-2630",
      "LMU-3640",
      "TTU-2830",
    ],
  };

  const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
  const modelList = models[manufacturer as keyof typeof models];
  const model = modelList[Math.floor(Math.random() * modelList.length)];

  return {
    id: `sim-${index}-${Date.now()}`,
    imei: `SIM${String(index + 1).padStart(
      3,
      "0",
    )}${Date.now().toString().slice(-9)}`,
    name: `Test Device ${index + 1}`,
    status: "disconnected",
    manufacturer,
    model,
    latitude: LAGOS_CENTER.lat + (Math.random() - 0.5) * 0.2,
    longitude: LAGOS_CENTER.lng + (Math.random() - 0.5) * 0.2,
    speed: Math.random() * 80,
    heading: Math.random() * 360,
    fuel: 50 + Math.random() * 50,
    battery: 11 + Math.random() * 3,
    messageCount: 0,
    errorCount: 0,
    insideGeofences: [],
  };
}

export function useMQTTSimulator() {
  const [
    devices,
    setDevices,
  ] = useState<SimulatedDevice[]>([]);
  const [
    messageLogs,
    setMessageLogs,
  ] = useState<MessageLog[]>([]);
  const [
    geofenceAlerts,
    setGeofenceAlerts,
  ] = useState<GeofenceAlert[]>([]);
  const [
    stats,
    setStats,
  ] = useState<ConnectionStats>({
    totalConnections: 0,
    activeConnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    errorsCount: 0,
    bytesTransferred: 0,
    avgLatency: 0,
    messagesPerSecond: 0,
  });
  const [
    isSimulating,
    setIsSimulating,
  ] = useState(false);

  const socketsRef = useRef<Map<string, WebSocket>>(new Map());
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimestampsRef = useRef<number[]>([]);

  // Check geofence breaches for a device
  const checkGeofenceBreaches = useCallback(
    (
      device: SimulatedDevice,
      newLat: number,
      newLng: number,
    ): {
      newInsideGeofences: string[];
      alerts: GeofenceAlert[];
    } => {
      const alerts: GeofenceAlert[] = [];
      const newInsideGeofences: string[] = [];

      GEOFENCE_ZONES.forEach((geofence) => {
        const wasInside = device.insideGeofences.includes(geofence.id);
        const isNowInside = isInsideGeofence(
          newLat,
          newLng,
          geofence,
        );

        if (isNowInside) {
          newInsideGeofences.push(geofence.id);
        }

        // Entry detection
        if (!wasInside && isNowInside) {
          const alert: GeofenceAlert = {
            id: `alert-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            deviceImei: device.imei,
            deviceName: device.name,
            geofenceName: geofence.name,
            geofenceType: geofence.type,
            alertType: "entry",
            latitude: newLat,
            longitude: newLng,
          };
          alerts.push(alert);
        }

        // Exit detection
        if (wasInside && !isNowInside) {
          const alert: GeofenceAlert = {
            id: `alert-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            deviceImei: device.imei,
            deviceName: device.name,
            geofenceName: geofence.name,
            geofenceType: geofence.type,
            alertType: "exit",
            latitude: newLat,
            longitude: newLng,
          };
          alerts.push(alert);
        }
      });

      return {
        newInsideGeofences,
        alerts,
      };
    },
    [],
  );

  const wsUrl = ``; // TODO: configure MQTT bridge URL via API

  // Add message to logs
  const addMessageLog = useCallback(
    (log: Omit<MessageLog, "id" | "timestamp">) => {
      const newLog: MessageLog = {
        ...log,
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      };

      setMessageLogs(prev => [
        newLog,
        ...prev,
      ].slice(
        0,
        500,
      ));

      messageTimestampsRef.current.push(Date.now());
      messageTimestampsRef.current = messageTimestampsRef.current.filter(
        t => Date.now() - t < 10000,
      );
    },
    [],
  );

  // Update stats
  const updateStats = useCallback(
    (update: Partial<ConnectionStats>) => {
      setStats(prev => ({
        ...prev,
        ...update,
        messagesPerSecond: messageTimestampsRef.current.length / 10,
      }));
    },
    [],
  );

  // Connect a device
  const connectDevice = useCallback(
    (deviceId: string) => {
      const device = devices.find(d => d.id === deviceId);
      if (!device || socketsRef.current.has(deviceId))
        return;

      setDevices(prev => prev.map(d =>
        d.id === deviceId
          ? {
              ...d,
              status: "connecting" as const,
            }
          : d));

      try {
        const ws = new WebSocket(wsUrl);
        socketsRef.current.set(
          deviceId,
          ws,
        );

        ws.onopen = () => {
          console.log(`WebSocket opened for device ${device.imei}`);

          const connectMsg = {
            topic: `device/${device.imei}/connect`,
            payload: {
              tenant_id: "simulator-test",
              manufacturer: device.manufacturer,
              model: device.model,
              firmware_version: "1.0.0-sim",
            },
          };

          ws.send(JSON.stringify(connectMsg));

          addMessageLog({
            deviceImei: device.imei,
            direction: "sent",
            topic: connectMsg.topic,
            payload: connectMsg.payload,
            type: "connect",
          });

          updateStats({
            totalConnections: stats.totalConnections + 1,
            activeConnections: socketsRef.current.size,
            messagesSent: stats.messagesSent + 1,
            bytesTransferred: stats.bytesTransferred + JSON.stringify(connectMsg).length,
          });
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log(
              `Received for ${device.imei}:`,
              data,
            );

            addMessageLog({
              deviceImei: device.imei,
              direction: "received",
              topic: data.topic || "response",
              payload: data,
              type: data.type || "unknown",
            });

            if (data.type === "connack" && data.returnCode === 0) {
              setDevices(prev => prev.map(d =>
                d.id === deviceId
                  ? {
                      ...d,
                      status: "connected" as const,
                      lastMessage: "Connected",
                    }
                  : d));
            }
            else if (data.type === "puback") {
              setDevices(prev => prev.map(d =>
                d.id === deviceId
                  ? {
                      ...d,
                      messageCount: d.messageCount + 1,
                      lastMessage: `Telemetry ACK (${d.messageCount + 1})`,
                    }
                  : d));
            }
            else if (data.type === "error") {
              setDevices(prev => prev.map(d =>
                d.id === deviceId
                  ? {
                      ...d,
                      errorCount: d.errorCount + 1,
                    }
                  : d));
              updateStats({ errorsCount: stats.errorsCount + 1 });
            }

            updateStats({
              messagesReceived: stats.messagesReceived + 1,
              bytesTransferred: stats.bytesTransferred + event.data.length,
            });
          }
          catch (e) {
            console.error(
              "Error parsing message:",
              e,
            );
          }
        };

        ws.onerror = (error) => {
          console.error(
            `WebSocket error for ${device.imei}:`,
            error,
          );
          setDevices(prev => prev.map(d =>
            d.id === deviceId
              ? {
                  ...d,
                  status: "error" as const,
                  errorCount: d.errorCount + 1,
                }
              : d));
          updateStats({ errorsCount: stats.errorsCount + 1 });
        };

        ws.onclose = () => {
          console.log(`WebSocket closed for ${device.imei}`);
          socketsRef.current.delete(deviceId);
          setDevices(prev => prev.map(d =>
            d.id === deviceId
              ? {
                  ...d,
                  status: "disconnected" as const,
                }
              : d));
          updateStats({ activeConnections: socketsRef.current.size });
        };
      }
      catch (error) {
        console.error(
          "Failed to create WebSocket:",
          error,
        );
        setDevices(prev => prev.map(d =>
          d.id === deviceId
            ? {
                ...d,
                status: "error" as const,
              }
            : d));
      }
    },
    [
      devices,
      wsUrl,
      addMessageLog,
      updateStats,
      stats,
    ],
  );

  // Disconnect a device
  const disconnectDevice = useCallback(
    (deviceId: string) => {
      const ws = socketsRef.current.get(deviceId);
      if (ws) {
        ws.close();
        socketsRef.current.delete(deviceId);
      }
      setDevices(prev => prev.map(d =>
        d.id === deviceId
          ? {
              ...d,
              status: "disconnected" as const,
            }
          : d));
    },
    [],
  );

  // Send telemetry for a device
  const sendTelemetry = useCallback(
    (deviceId: string) => {
      const device = devices.find(d => d.id === deviceId);
      const ws = socketsRef.current.get(deviceId);

      if (!device || !ws || ws.readyState !== WebSocket.OPEN)
        return;

      const newLat = device.latitude + (Math.random() - 0.5) * 0.002;
      const newLng = device.longitude + (Math.random() - 0.5) * 0.002;
      const newSpeed = Math.max(
        0,
        device.speed + (Math.random() - 0.5) * 10,
      );
      const newHeading = (device.heading + (Math.random() - 0.5) * 20 + 360) % 360;
      const newFuel = Math.max(
        0,
        device.fuel - Math.random() * 0.1,
      );

      // Check geofence breaches
      const {
        newInsideGeofences,
        alerts,
      } = checkGeofenceBreaches(
        device,
        newLat,
        newLng,
      );

      // Process alerts
      if (alerts.length > 0) {
        setGeofenceAlerts(prev => [
          ...alerts,
          ...prev,
        ].slice(
          0,
          100,
        ));

        alerts.forEach((alert) => {
          const isRestricted = alert.geofenceType === "restricted";
          if (isRestricted && alert.alertType === "entry") {
            toast.error(
              `Geofence ${alert.alertType === "entry" ? "Entry" : "Exit"} Alert`,
              { description: `${alert.deviceName} ${alert.alertType === "entry" ? "entered" : "exited"} ${alert.geofenceName}` },
            );
          }
          else {
            toast.info(
              `Geofence ${alert.alertType === "entry" ? "Entry" : "Exit"} Alert`,
              { description: `${alert.deviceName} ${alert.alertType === "entry" ? "entered" : "exited"} ${alert.geofenceName}` },
            );
          }

          addMessageLog({
            deviceImei: device.imei,
            direction: "received",
            topic: `geofence/${alert.alertType}`,
            payload: {
              geofence: alert.geofenceName,
              type: alert.geofenceType,
              position: {
                lat: newLat,
                lng: newLng,
              },
            },
            type: `geofence_${alert.alertType}`,
          });
        });
      }

      const harshBraking = Math.random() < 0.02;
      const harshAcceleration = Math.random() < 0.02;
      const overspeeding = newSpeed > 100;

      const telemetryMsg = {
        topic: `device/${device.imei}/telemetry`,
        payload: {
          latitude: newLat,
          longitude: newLng,
          speed: newSpeed,
          heading: newHeading,
          altitude: 50 + Math.random() * 10,
          fuel_level: newFuel,
          battery_voltage: device.battery,
          engine_status: "running",
          engine_rpm: 1500 + Math.random() * 2000,
          coolant_temp: 85 + Math.random() * 10,
          odometer: 50000 + Math.random() * 1000,
          harsh_braking: harshBraking,
          harsh_acceleration: harshAcceleration,
          overspeeding,
          geofences: newInsideGeofences,
          raw_data: {
            signal_strength: 70 + Math.random() * 30,
            satellites: Math.floor(8 + Math.random() * 6),
          },
        },
      };

      ws.send(JSON.stringify(telemetryMsg));

      setDevices(prev => prev.map(d =>
        d.id === deviceId
          ? {
              ...d,
              latitude: newLat,
              longitude: newLng,
              speed: newSpeed,
              heading: newHeading,
              fuel: newFuel,
              insideGeofences: newInsideGeofences,
            }
          : d));

      addMessageLog({
        deviceImei: device.imei,
        direction: "sent",
        topic: telemetryMsg.topic,
        payload: telemetryMsg.payload,
        type: "telemetry",
      });

      updateStats({
        messagesSent: stats.messagesSent + 1,
        bytesTransferred: stats.bytesTransferred + JSON.stringify(telemetryMsg).length,
      });
    },
    [
      devices,
      addMessageLog,
      updateStats,
      stats,
      checkGeofenceBreaches,
    ],
  );

  // Add devices
  const addDevices = useCallback(
    (count: number) => {
      const newDevices = Array.from(
        { length: count },
        (_, i) =>
          generateRandomDevice(devices.length + i),
      );
      setDevices(prev => [
        ...prev,
        ...newDevices,
      ]);
      toast.success(
        "Devices Added",
        { description: `Added ${count} simulated device(s)` },
      );
    },
    [devices.length],
  );

  // Remove device
  const removeDevice = useCallback(
    (deviceId: string) => {
      disconnectDevice(deviceId);
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    },
    [disconnectDevice],
  );

  // Connect all devices
  const connectAll = useCallback(
    () => {
      devices.forEach((d) => {
        if (d.status === "disconnected") {
          setTimeout(
            connectDevice,
            Math.random() * 1000,
            d.id,
          );
        }
      });
    },
    [
      devices,
      connectDevice,
    ],
  );

  // Disconnect all devices
  const disconnectAll = useCallback(
    () => {
      devices.forEach(d => disconnectDevice(d.id));
    },
    [
      devices,
      disconnectDevice,
    ],
  );

  // Ref for devices to avoid stale closure in simulation interval
  const devicesRef = useRef<SimulatedDevice[]>([]);
  devicesRef.current = devices;

  // Start simulation
  const startSimulation = useCallback(
    (intervalMs: number = 2000) => {
      if (simulationIntervalRef.current)
        return;

      // Ensure all devices are connected before starting telemetry
      devicesRef.current.forEach((d) => {
        if (d.status === "disconnected") {
          connectDevice(d.id);
        }
      });

      setIsSimulating(true);
      simulationIntervalRef.current = setInterval(
        () => {
          devicesRef.current.forEach((d) => {
            if (d.status === "connected") {
              sendTelemetry(d.id);
            }
          });
        },
        intervalMs,
      );

      toast.success(
        "Simulation Started",
        { description: `Sending telemetry every ${intervalMs / 1000}s` },
      );
    },
    [
      connectDevice,
      sendTelemetry,
    ],
  );

  // Stop simulation
  const stopSimulation = useCallback(
    () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      setIsSimulating(false);
      toast.info("Simulation Stopped");
    },
    [],
  );

  // Clear logs
  const clearLogs = useCallback(
    () => {
      setMessageLogs([]);
    },
    [],
  );

  // Clear geofence alerts
  const clearGeofenceAlerts = useCallback(
    () => {
      setGeofenceAlerts([]);
    },
    [],
  );

  // Cleanup on unmount
  useEffect(
    () => {
      return () => {
        stopSimulation();
        socketsRef.current.forEach(ws => ws.close());
        socketsRef.current.clear();
      };
    },
    [stopSimulation],
  );

  return {
    devices,
    messageLogs,
    geofenceAlerts,
    geofenceZones: GEOFENCE_ZONES,
    stats,
    isSimulating,
    addDevices,
    removeDevice,
    connectDevice,
    disconnectDevice,
    connectAll,
    disconnectAll,
    sendTelemetry,
    startSimulation,
    stopSimulation,
    clearLogs,
    clearGeofenceAlerts,
  };
}
