import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Activity, Box, Layers, Map as MapIcon, Radio } from 'lucide-react';

interface DataVisualizationProps {
  isConnected: boolean;
  isActive: boolean;
}

export function DataVisualization({ isConnected, isActive }: DataVisualizationProps) {
  const [lidarData, setLidarData] = useState<Array<{ angle: number; distance: number }>>([]);
  const [tfData, setTfData] = useState<Array<{ from: string; to: string; x: number; y: number; z: number }>>([]);

  useEffect(() => {
    if (!isConnected || !isActive) return;

    // Simulate lidar scan data
    const lidarInterval = setInterval(() => {
      const points = Array.from({ length: 360 }, (_, i) => ({
        angle: i,
        distance: 50 + Math.random() * 150 + Math.sin(i * 0.1) * 30,
      }));
      setLidarData(points);
    }, 100);

    // Simulate TF transforms
    const tfInterval = setInterval(() => {
      setTfData([
        { from: 'base_link', to: 'laser', x: 0.1, y: 0, z: 0.2 },
        { from: 'base_link', to: 'wheel_left', x: -0.15, y: 0.1, z: -0.05 },
        { from: 'base_link', to: 'wheel_right', x: -0.15, y: -0.1, z: -0.05 },
        { from: 'base_link', to: 'camera', x: 0.12, y: 0, z: 0.15 },
      ]);
    }, 1000);

    return () => {
      clearInterval(lidarInterval);
      clearInterval(tfInterval);
    };
  }, [isConnected, isActive]);

  const renderLidarScan = () => {
    const size = 200;
    const center = size / 2;
    const scale = 0.8;

    return (
      <svg width={size} height={size} className="mx-auto">
        {/* Background circle */}
        <circle cx={center} cy={center} r={center - 10} fill="rgba(15, 23, 42, 0.5)" stroke="rgb(71, 85, 105)" strokeWidth="1" />
        
        {/* Grid circles */}
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <circle
            key={r}
            cx={center}
            cy={center}
            r={(center - 10) * r}
            fill="none"
            stroke="rgb(51, 65, 85)"
            strokeWidth="0.5"
            opacity="0.3"
          />
        ))}

        {/* Center point (robot) */}
        <circle cx={center} cy={center} r="3" fill="rgb(59, 130, 246)" />

        {/* Lidar points */}
        {lidarData.map((point, i) => {
          if (i % 3 !== 0) return null; // Skip some points for performance
          const angle = (point.angle * Math.PI) / 180;
          const distance = (point.distance / 200) * (center - 10) * scale;
          const x = center + Math.cos(angle) * distance;
          const y = center + Math.sin(angle) * distance;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="1"
              fill="rgb(168, 85, 247)"
              opacity="0.6"
            />
          );
        })}
      </svg>
    );
  };

  const renderRobotModel = () => {
    return (
      <svg width="200" height="200" className="mx-auto" viewBox="0 0 200 200">
        {/* Base link */}
        <rect x="70" y="80" width="60" height="40" fill="rgb(59, 130, 246)" opacity="0.7" />
        <text x="100" y="105" textAnchor="middle" fill="white" fontSize="10">base_link</text>

        {/* Wheels */}
        <circle cx="75" cy="80" r="8" fill="rgb(34, 197, 94)" opacity="0.7" />
        <text x="75" y="65" textAnchor="middle" fill="rgb(34, 197, 94)" fontSize="8">L</text>
        
        <circle cx="125" cy="80" r="8" fill="rgb(34, 197, 94)" opacity="0.7" />
        <text x="125" y="65" textAnchor="middle" fill="rgb(34, 197, 94)" fontSize="8">R</text>

        {/* Laser */}
        <rect x="95" y="60" width="10" height="10" fill="rgb(168, 85, 247)" opacity="0.7" />
        <text x="100" y="50" textAnchor="middle" fill="rgb(168, 85, 247)" fontSize="8">laser</text>

        {/* Camera */}
        <rect x="110" y="90" width="8" height="8" fill="rgb(234, 179, 8)" opacity="0.7" />
        <text x="125" y="95" textAnchor="middle" fill="rgb(234, 179, 8)" fontSize="8">camera</text>

        {/* Coordinate frame */}
        <g transform="translate(100, 100)">
          <line x1="0" y1="0" x2="30" y2="0" stroke="red" strokeWidth="2" />
          <text x="35" y="5" fill="red" fontSize="10">X</text>
          <line x1="0" y1="0" x2="0" y2="-30" stroke="green" strokeWidth="2" />
          <text x="5" y="-35" fill="green" fontSize="10">Y</text>
        </g>
      </svg>
    );
  };

  const renderMap = () => {
    return (
      <div className="relative w-full h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded border border-slate-700">
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="viz-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-500" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#viz-grid)" />
          </svg>
        </div>

        {/* Simulated occupancy map */}
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="absolute bg-purple-500/30 rounded"
            style={{
              left: `${10 + Math.random() * 70}%`,
              top: `${10 + Math.random() * 70}%`,
              width: `${5 + Math.random() * 10}%`,
              height: `${5 + Math.random() * 10}%`,
            }}
          />
        ))}

        {/* Robot position */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
        </div>
      </div>
    );
  };

  if (!isConnected || !isActive) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Data Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500 text-sm">
            {!isConnected ? 'Connect robot to view data' : 'Data visualization available in autonomous mode'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Data Visualization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="lidar" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
            <TabsTrigger value="lidar" className="text-xs data-[state=active]:bg-slate-700">
              <Radio className="w-3 h-3 mr-1" />
              Lidar
            </TabsTrigger>
            <TabsTrigger value="model" className="text-xs data-[state=active]:bg-slate-700">
              <Box className="w-3 h-3 mr-1" />
              Model
            </TabsTrigger>
            <TabsTrigger value="tf" className="text-xs data-[state=active]:bg-slate-700">
              <Layers className="w-3 h-3 mr-1" />
              TF
            </TabsTrigger>
            <TabsTrigger value="map" className="text-xs data-[state=active]:bg-slate-700">
              <MapIcon className="w-3 h-3 mr-1" />
              Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lidar" className="mt-4">
            <div className="space-y-2">
              {renderLidarScan()}
              <div className="text-center text-xs text-slate-400">
                Real-time Lidar Scan ({lidarData.length} points)
              </div>
            </div>
          </TabsContent>

          <TabsContent value="model" className="mt-4">
            <div className="space-y-2">
              {renderRobotModel()}
              <div className="text-center text-xs text-slate-400">
                Robot Model & Links
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tf" className="mt-4">
            <div className="space-y-2">
              {tfData.map((tf, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-xs border border-slate-700">
                  <span className="text-blue-400">{tf.from}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-purple-400">{tf.to}</span>
                  <span className="text-slate-400 font-mono">
                    ({tf.x.toFixed(2)}, {tf.y.toFixed(2)}, {tf.z.toFixed(2)})
                  </span>
                </div>
              ))}
              <div className="text-center text-xs text-slate-400 mt-2">
                Transform Tree
              </div>
            </div>
          </TabsContent>

          <TabsContent value="map" className="mt-4">
            <div className="space-y-2">
              {renderMap()}
              <div className="text-center text-xs text-slate-400">
                Occupancy Map
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
