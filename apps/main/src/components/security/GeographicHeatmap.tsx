import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, TrendingUp, AlertTriangle } from 'lucide-react';

interface LoginAttempt {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  count: number;
  threatLevel: 'low' | 'medium' | 'high';
  lastAttempt: Date;
}

interface GeographicHeatmapProps {
  attempts: LoginAttempt[];
}

interface CountryData {
  country: string;
  countryCode: string;
  totalAttempts: number;
  cities: { city: string; count: number }[];
  threatLevel: 'low' | 'medium' | 'high';
  ips: string[];
}

const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const getHeatColor = (intensity: number, max: number): string => {
  const ratio = max > 0 ? intensity / max : 0;
  if (ratio > 0.7) return 'bg-red-500/20 border-red-500/50';
  if (ratio > 0.4) return 'bg-orange-500/20 border-orange-500/50';
  if (ratio > 0.2) return 'bg-yellow-500/20 border-yellow-500/50';
  return 'bg-green-500/20 border-green-500/50';
};

const getThreatColor = (level: string): string => {
  switch (level) {
    case 'high': return 'bg-destructive text-destructive-foreground';
    case 'medium': return 'bg-orange-500 text-white';
    default: return 'bg-green-500 text-white';
  }
};

export function GeographicHeatmap({ attempts }: GeographicHeatmapProps) {
  const countryData = useMemo(() => {
    const grouped = attempts.reduce<Record<string, CountryData>>((acc, attempt) => {
      const key = attempt.countryCode || attempt.country;
      
      if (!acc[key]) {
        acc[key] = {
          country: attempt.country,
          countryCode: attempt.countryCode,
          totalAttempts: 0,
          cities: [],
          threatLevel: 'low',
          ips: []
        };
      }
      
      acc[key].totalAttempts += attempt.count;
      acc[key].ips.push(attempt.ip);
      
      const cityIndex = acc[key].cities.findIndex(c => c.city === attempt.city);
      if (cityIndex >= 0) {
        acc[key].cities[cityIndex].count += attempt.count;
      } else {
        acc[key].cities.push({ city: attempt.city, count: attempt.count });
      }
      
      // Escalate threat level
      if (attempt.threatLevel === 'high') acc[key].threatLevel = 'high';
      else if (attempt.threatLevel === 'medium' && acc[key].threatLevel !== 'high') {
        acc[key].threatLevel = 'medium';
      }
      
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.totalAttempts - a.totalAttempts);
  }, [attempts]);

  const maxAttempts = useMemo(() => 
    Math.max(...countryData.map(c => c.totalAttempts), 1),
  [countryData]);

  const totalAttempts = useMemo(() => 
    countryData.reduce((sum, c) => sum + c.totalAttempts, 0),
  [countryData]);

  const highThreatCount = useMemo(() => 
    countryData.filter(c => c.threatLevel === 'high').length,
  [countryData]);

  if (attempts.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Globe className="h-5 w-5" />
            Geographic Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MapPin className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No login attempts recorded</p>
            <p className="text-sm">Geographic data will appear here when attempts are detected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Globe className="h-5 w-5" />
              Geographic Distribution
            </CardTitle>
            <CardDescription>Login activity and threat density mapped by country of origin</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {totalAttempts} total
            </Badge>
            {highThreatCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {highThreatCount} high threat
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Heatmap Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {countryData.slice(0, 8).map((country) => (
            <div
              key={country.countryCode}
              className={`relative p-4 rounded-lg border-2 transition-all hover:scale-105 ${getHeatColor(country.totalAttempts, maxAttempts)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getFlagEmoji(country.countryCode)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{country.country}</p>
                  <p className="text-xs text-muted-foreground">{country.countryCode}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-foreground">{country.totalAttempts}</span>
                <Badge className={getThreatColor(country.threatLevel)} variant="secondary">
                  {country.threatLevel}
                </Badge>
              </div>
              {/* Intensity bar */}
              <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(country.totalAttempts / maxAttempts) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Country</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Top Cities</th>
                <th className="text-center p-3 text-sm font-medium text-muted-foreground">Attempts</th>
                <th className="text-center p-3 text-sm font-medium text-muted-foreground">Unique IPs</th>
                <th className="text-center p-3 text-sm font-medium text-muted-foreground">Threat</th>
              </tr>
            </thead>
            <tbody>
              {countryData.map((country, index) => (
                <tr key={country.countryCode} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getFlagEmoji(country.countryCode)}</span>
                      <span className="font-medium text-foreground">{country.country}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {country.cities.slice(0, 3).map((city) => (
                        <Badge key={city.city} variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {city.city} ({city.count})
                        </Badge>
                      ))}
                      {country.cities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{country.cities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-bold text-foreground">{country.totalAttempts}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-muted-foreground">{country.ips.length}</span>
                  </td>
                  <td className="p-3 text-center">
                    <Badge className={getThreatColor(country.threatLevel)}>
                      {country.threatLevel}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="font-medium">Intensity:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/50" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/50" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500/50" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/50" />
            <span>Critical</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
