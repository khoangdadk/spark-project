import React, { useMemo, useState } from "react";
import { Search, TrendingUp, Clock3, ExternalLink, Sparkles, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine } from "recharts";

const comparisonRows = [
  { supermarket: "Coles", price: 4.5, sale: true, unit: "$4.50 / 1L", url: "#" },
  { supermarket: "Woolworths", price: 4.8, sale: false, unit: "$4.80 / 1L", url: "#" },
  { supermarket: "Aldi", price: 4.4, sale: false, unit: "$4.40 / 1L", url: "#" },
  { supermarket: "IGA", price: 5.1, sale: true, unit: "$5.10 / 1L", url: "#" },
];

const chartData = [
  { label: "-4w", history: 5.3, prediction: null },
  { label: "-3w", history: 5.1, prediction: null },
  { label: "-2w", history: 4.9, prediction: null, event: "Easter promo" },
  { label: "-1w", history: 4.6, prediction: null },
  { label: "Now", history: 4.5, prediction: 4.5 },
  { label: "+1w", history: null, prediction: 4.7 },
  { label: "+2w", history: null, prediction: 4.2, event: "School holiday sale" },
  { label: "+Event", history: null, prediction: 4.0, event: "Next Easter" },
];

const pastEvents = [
  { name: "Easter", when: "2 weeks ago", impact: "Price dropped 8%" },
  { name: "Weekend special", when: "3 weeks ago", impact: "Short 2-day discount" },
];

const nextEvents = [
  { name: "School holiday sale", when: "In 10 days", impact: "Likely discount" },
  { name: "Next Easter", when: "Seasonal event", impact: "High promo chance" },
];

export default function MVPPriceForecastUIMockup() {
  const [query, setQuery] = useState("Milk");
  const [selectedStore, setSelectedStore] = useState("Coles");

  const bestDeal = useMemo(() => {
    return [...comparisonRows].sort((a, b) => a.price - b.price)[0];
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">MVP website</p>
            <h1 className="text-3xl font-semibold tracking-tight">SaleSeer</h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card className="rounded-3xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Search className="h-5 w-5" /> Search product
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 md:flex-row">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search a product, e.g. Milk, Eggs, Coca-Cola"
                    className="h-12 rounded-2xl"
                  />
                  <Button className="h-12 rounded-2xl px-6">Search</Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Milk", "Eggs", "Coke", "Bread", "Bananas"].map((item) => (
                    <Badge key={item} variant="secondary" className="rounded-full px-3 py-1">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Comparison table</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Showing current prices for “{query}” across supermarkets</p>
                </div>
                <Badge className="rounded-full">Best deal: {bestDeal.supermarket}</Badge>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-2xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supermarket</TableHead>
                        <TableHead>Current price</TableHead>
                        <TableHead>Sale</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonRows.map((row) => (
                        <TableRow key={row.supermarket} className={selectedStore === row.supermarket ? "bg-slate-50" : ""}>
                          <TableCell className="font-medium">{row.supermarket}</TableCell>
                          <TableCell>${row.price.toFixed(2)}</TableCell>
                          <TableCell>
                            {row.sale ? (
                              <Badge className="rounded-full">On sale</Badge>
                            ) : (
                              <Badge variant="secondary" className="rounded-full">Regular</Badge>
                            )}
                          </TableCell>
                          <TableCell>{row.unit}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              className="rounded-2xl"
                              onClick={() => setSelectedStore(row.supermarket)}
                            >
                              View history & prediction
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Selected product</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-slate-100 p-4">
                  <p className="text-sm text-slate-500">Product</p>
                  <p className="text-lg font-semibold">{query} 1L</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className="rounded-full">{selectedStore}</Badge>
                    <Badge variant="secondary" className="rounded-full">Dairy</Badge>
                    <Badge variant="secondary" className="rounded-full">Updated today</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border p-4">
                    <p className="text-sm text-slate-500">Current price</p>
                    <p className="text-2xl font-semibold">$4.50</p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <p className="text-sm text-slate-500">Expected next low</p>
                    <p className="text-2xl font-semibold">$4.20</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full rounded-2xl gap-2">
                  Open product page <ExternalLink className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">History and prediction</CardTitle>
            <p className="text-sm text-slate-500">
              Grey = product history (past 4 weeks), red = forecast (next 2 weeks), with seasonal/special events highlighted.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="timeline" className="space-y-4">
              <TabsList className="grid w-full max-w-md grid-cols-3 rounded-2xl">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="prediction">Prediction</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline">
                <div className="rounded-2xl border p-4">
                  <div className="h-[340px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <XAxis dataKey="label" />
                        <YAxis domain={[3.8, 5.6]} />
                        <Tooltip />
                        <ReferenceArea x1="-4w" x2="Now" fillOpacity={0.05} />
                        <ReferenceLine x="Now" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="history" stroke="#94a3b8" strokeWidth={3} dot />
                        <Line type="monotone" dataKey="prediction" stroke="#ef4444" strokeWidth={3} dot />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="rounded-2xl shadow-none">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4" /> Past 4 weeks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Week -4</span><span>$5.30</span></div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Week -3</span><span>$5.10</span></div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Week -2</span><span>$4.90</span></div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Week -1</span><span>$4.60</span></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl shadow-none">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4" /> Past special events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        {pastEvents.map((e) => (
                          <div key={e.name} className="rounded-xl border p-3">
                            <p className="font-medium">{e.name}</p>
                            <p className="text-slate-500">{e.when}</p>
                            <p className="mt-1">{e.impact}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="prediction">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="rounded-2xl shadow-none">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" /> Next 2 weeks forecast</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between rounded-xl bg-red-50 p-3"><span>Week +1</span><span>$4.70</span></div>
                        <div className="flex items-center justify-between rounded-xl bg-red-50 p-3"><span>Week +2</span><span>$4.20</span></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl shadow-none">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4" /> Next special events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        {nextEvents.map((e) => (
                          <div key={e.name} className="rounded-xl border p-3">
                            <p className="font-medium">{e.name}</p>
                            <p className="text-slate-500">{e.when}</p>
                            <p className="mt-1">{e.impact}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
