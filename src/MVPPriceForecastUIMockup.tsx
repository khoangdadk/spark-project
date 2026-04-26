import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { Search, TrendingUp, Clock3, ExternalLink, Sparkles, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine } from "recharts";

const PRODUCT_OPTIONS = [
  { key: "cage_free_eggs", label: "Cage free eggs" },
  { key: "full_cream_milk_1l", label: "Full cream milk 1L" },
  { key: "cadbury_dairy_milk_180g", label: "Cadbury Dairy Milk Chocolate 180g" },
  { key: "beef_topside", label: "Beef topside" },
  { key: "chicken_breast_large_pack", label: "Chicken Breast Fillets Large Pack" },
  { key: "chicken_thigh_cutlets", label: "Chicken Thigh Cutlets" },
  { key: "brown_onions_1kg", label: "Brown Onions 1kg" },
  { key: "pork_mince_500g", label: "Pork Mince 500g" },
  { key: "bananas", label: "Bananas" },
  { key: "carrots_1kg", label: "Carrots 1kg" },
];

type ProductRow = {
  requested_product: string;
  product_key: string;
  supermarket: string;
  matched_product_name: string;
  current_price_aud: string;
  unit_display: string;
  price_per_unit_aud: string;
  price_per_unit_basis: string;
  on_sale: string;
  sale_label: string;
  product_url: string;
  frontend_available: string;
  history_wk_minus_4_aud: string;
  history_wk_minus_3_aud: string;
  history_wk_minus_2_aud: string;
  history_wk_minus_1_aud: string;
  history_current_aud: string;
  history_event_past: string;
  next_week_price_aud: string;
  prediction_confidence_pct: string;
  prediction_event: string;
  notes: string;
  source_confidence: string;
};

function toNumber(value: string | number | null | undefined) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toBool(value: string | boolean | null | undefined) {
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}

export default function MVPPriceForecastUIMockup() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("full_cream_milk_1l");
  const [selectedStore, setSelectedStore] = useState("Coles");
  const [tab, setTab] = useState("timeline");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const productKey = params.get("product_key");
    const store = params.get("store");

    const validProductKey = PRODUCT_OPTIONS.some((p) => p.key === productKey);

    if (productKey && validProductKey) {
      setQuery(productKey);
    }

    if (store) {
      setSelectedStore(store);
    }
  }, []);

  useEffect(() => {
  fetch("/data/mock_supermarket_products.csv")
    .then((res) => res.text())
    .then((csvText) => {
      Papa.parse<ProductRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setRows(results.data);
          setLoading(false);
        },
        error: (err) => {
          setError(err.message);
          setLoading(false);
        },
      });
    })
    .catch((err) => {
      setError(String(err));
      setLoading(false);
    });
  }, []);

  const availableRows = useMemo(() => {
    return rows.filter(
      (r) => r.product_key === query && toBool(r.frontend_available)
    );
  }, [rows, query]);

  const comparisonRows = useMemo(() => {
    return availableRows.map((r) => ({
      supermarket: r.supermarket,
      price: toNumber(r.current_price_aud) ?? 0,
      sale: toBool(r.on_sale),
      saleLabel: r.sale_label || "Regular",
      unit:
        toNumber(r.price_per_unit_aud) != null
          ? `$${toNumber(r.price_per_unit_aud)!.toFixed(2)} / ${r.price_per_unit_basis}`
          : r.unit_display,
      category: r.requested_product,
      matchedName: r.matched_product_name,
      url: r.product_url,
      notes: r.notes,
      sourceConfidence: r.source_confidence,
    }));
  }, [availableRows]);

  const selectedRow = useMemo(() => {
    return availableRows.find((r) => r.supermarket === selectedStore) || availableRows[0] || null;
  }, [availableRows, selectedStore]);

  const bestDeal = useMemo(() => {
    if (comparisonRows.length === 0) return null;
    return [...comparisonRows].sort((a, b) => a.price - b.price)[0];
  }, [comparisonRows]);

  const chartData = useMemo(() => {
    if (!selectedRow) return [];
    return [
      {
        label: "-4w",
        history: toNumber(selectedRow.history_wk_minus_4_aud),
        prediction: null,
      },
      {
        label: "-3w",
        history: toNumber(selectedRow.history_wk_minus_3_aud),
        prediction: null,
      },
      {
        label: "-2w",
        history: toNumber(selectedRow.history_wk_minus_2_aud),
        prediction: null,
      },
      {
        label: "-1w",
        history: toNumber(selectedRow.history_wk_minus_1_aud),
        prediction: null,
        event: selectedRow.history_event_past || undefined,
      },
      {
        label: "Now",
        history: toNumber(selectedRow.history_current_aud),
        prediction: toNumber(selectedRow.history_current_aud),
      },
      {
        label: "+1w",
        history: null,
        prediction: toNumber(selectedRow.next_week_price_aud),
        event: selectedRow.prediction_event || undefined,
      },
    ];
  }, [selectedRow]);

  const pastEvents = useMemo(() => {
    if (!selectedRow?.history_event_past) return [];
    return [
      {
        name: selectedRow.history_event_past,
        when: "Past event",
        impact: "Historical price movement",
      },
    ];
  }, [selectedRow]);

  const nextEvents = useMemo(() => {
    if (!selectedRow?.prediction_event) return [];
    return [
      {
        name: selectedRow.prediction_event,
        when: "Next week",
        impact: `Prediction confidence: ${selectedRow.prediction_confidence_pct || "N/A"}%`,
      },
    ];
  }, [selectedRow]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardContent className="p-6">Loading mock supermarket data...</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardContent className="p-6">Failed to load CSV: {error}</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
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
                  <select
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSelectedStore("Coles");
                    }}
                    className="h-12 rounded-2xl border px-4"
                  >
                    {PRODUCT_OPTIONS.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <Button className="h-12 rounded-2xl px-6" type="button">
                    Search
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {PRODUCT_OPTIONS.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setQuery(item.key);
                        setSelectedStore("Coles");
                      }}
                    >
                      <Badge
                        variant={query === item.key ? "default" : "secondary"}
                        className="rounded-full px-3 py-1"
                      >
                        {item.label}
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Comparison table</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    Showing current prices for “{PRODUCT_OPTIONS.find((p) => p.key === query)?.label || query}” across supermarkets
                  </p>
                </div>
                <Badge className="rounded-full">Best deal: {bestDeal ? bestDeal.supermarket : "N/A"}</Badge>
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
                              <Badge className="rounded-full">{row.saleLabel || "On sale"}</Badge>
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
                  <p className="text-lg font-semibold">
                    {selectedRow?.matched_product_name || "No product selected"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className="rounded-full">{selectedRow?.supermarket || selectedStore}</Badge>
                    <Badge variant="secondary" className="rounded-full">
                      {selectedRow?.requested_product || "Unknown category"}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      {selectedRow?.source_confidence ? `Source: ${selectedRow.source_confidence}` : "Loaded from CSV"}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border p-4">
                    <p className="text-sm text-slate-500">Current price</p>
                    <p className="text-2xl font-semibold">
                      {selectedRow?.current_price_aud ? `$${Number(selectedRow.current_price_aud).toFixed(2)}` : "N/A"}
                    </p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <p className="text-sm text-slate-500">Expected next low</p>
                    <p className="text-2xl font-semibold">
                      {selectedRow?.next_week_price_aud ? `$${Number(selectedRow.next_week_price_aud).toFixed(2)}` : "N/A"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full rounded-2xl gap-2"
                  onClick={() => selectedRow?.product_url && window.open(selectedRow.product_url, "_blank")}
                >
                  Open product page <ExternalLink className="h-4 w-4" />
                </Button>
                {selectedRow?.prediction_confidence_pct != null && (
                  <div className="mt-3 rounded-xl border border-blue-300 bg-blue-50 p-3 shadow-sm">
                    <p className="text-sm font-semibold text-blue-800">
                      Prediction confidence: {selectedRow.prediction_confidence_pct}%
                    </p>
                  </div>
                )}
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
                        {selectedRow && (
                          <>
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                              <span>Week -4</span><span>${Number(selectedRow.history_wk_minus_4_aud).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                              <span>Week -3</span><span>${Number(selectedRow.history_wk_minus_3_aud).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                              <span>Week -2</span><span>${Number(selectedRow.history_wk_minus_2_aud).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                              <span>Week -1</span><span>${Number(selectedRow.history_wk_minus_1_aud).toFixed(2)}</span>
                            </div>
                          </>
                        )}
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
                        {selectedRow && (
                          <div className="flex items-center justify-between rounded-xl bg-red-50 p-3">
                            <span>Week +1</span>
                            <span>${Number(selectedRow.next_week_price_aud).toFixed(2)}</span>
                          </div>
                        )}
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
