import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Code2, Copy, Download, Save, Loader2, Info, Plus, Play, Database, Network } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const EXAMPLE_PROMPTS = [
  "Create a users table with standard authentication fields",
  "Get the top 5 highest paying customers this month",
  "Add a foreign key for department_id to employees table",
];

const DIALECTS = ['PostgreSQL', 'MySQL', 'SQLite', 'SQL Server'];
const QUERY_TYPES = ['SELECT', 'CREATE', 'UPDATE', 'DELETE', 'ALTER'];

export default function Generate() {
  const [prompt, setPrompt] = useState('');
  const [dialect, setDialect] = useState('PostgreSQL');
  const [queryType, setQueryType] = useState('SELECT');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSql, setGeneratedSql] = useState('');
  const [explanation, setExplanation] = useState('');
  const [schemaTables, setSchemaTables] = useState<any[]>([]);
  const [erd, setErd] = useState('');
  const [sampleData, setSampleData] = useState('');
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setExecutionResult(null); // Clear previous results
    try {
      const { data } = await axios.post('/api/sql/generate', { prompt, dialect, queryType });
      setGeneratedSql(data.sql);
      setExplanation(data.explanation);
      setSchemaTables(data.tables || []);
      setErd(data.erd || '');
      setSampleData(data.sampleData || '');
      toast.success("SQL generated successfully!");
    } catch (error: any) {
      const apiError = error.response?.data?.details || error.response?.data?.error || 'Failed to generate SQL';
      toast.error(apiError);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      await axios.post('/api/sql/save', { 
        title: prompt.substring(0, 50) + '...', 
        prompt, 
        sql: generatedSql, 
        dialect, 
        type: queryType, 
        explanation 
      });
      toast.success("Saved to history");
    } catch (error) {
      toast.error("Failed to save query");
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setExecutionResult(null);
    try {
      const { data } = await axios.post('/api/sql/execute', { sql: generatedSql });
      if (data.success) {
        setExecutionResult(data);
        toast.success(`Executed in ${data.executionTimeMs}ms`);
      }
    } catch (error: any) {
      setExecutionResult({ error: error.response?.data?.details || 'Execution failed' });
      toast.error("Query execution failed");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecuteSampleData = async () => {
    setIsExecuting(true);
    setExecutionResult(null);
    try {
      const { data } = await axios.post('/api/sql/execute', { sql: sampleData });
      if (data.success) {
        setExecutionResult(data);
        toast.success(`Inserted sample data in ${data.executionTimeMs}ms`);
      }
    } catch (error: any) {
      setExecutionResult({ error: error.response?.data?.details || 'Execution failed' });
      toast.error("Sample data insertion failed");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAddToDatabase = async () => {
    try {
      await axios.post('/api/schema/tables/parse', { sql: generatedSql });
      toast.success("Table added to your database schema!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add table");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSql);
    toast.success("Copied to clipboard");
  };

  const hasCreateTable = generatedSql.toUpperCase().includes('CREATE TABLE');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8 pb-12"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Generate SQL</h1>
        <p className="text-muted-foreground text-lg">
          Describe what you want to achieve in plain English, and our AI will write the perfect SQL query.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-md">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold tracking-tight">Your Prompt</label>
                <Textarea 
                  placeholder="e.g., Get the top 5 highest paying customers this month..."
                  className="min-h-[140px] resize-none text-base p-4"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold tracking-tight">Example Prompts</label>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((ex, i) => (
                    <Badge 
                      key={i} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary/20 font-normal px-3 py-1.5 transition-colors"
                      onClick={() => {
                        setPrompt(ex);
                        if (ex.includes("Create")) setQueryType("CREATE");
                      }}
                    >
                      {ex}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold tracking-tight">Dialect</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={dialect}
                    onChange={(e) => setDialect(e.target.value)}
                  >
                    {DIALECTS.map(d => <option key={d} className="bg-background text-foreground">{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold tracking-tight">Query Type</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={queryType}
                    onChange={(e) => setQueryType(e.target.value)}
                  >
                    {QUERY_TYPES.map(q => <option key={q} className="bg-background text-foreground">{q}</option>)}
                  </select>
                </div>
              </div>

              <Button 
                className="w-full h-11 text-base font-semibold mt-4" 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-2" />
                )}
                Generate SQL
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          {generatedSql ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="rounded-xl overflow-hidden border border-border shadow-lg bg-[#0d1117] flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#161b22]">
                  <div className="flex items-center text-sm font-medium text-slate-300">
                    <Code2 className="w-4 h-4 mr-2" />
                    Generated SQL
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={handleCopy}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => toast.success("Download started")}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={handleSave}>
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 overflow-x-auto">
                  <pre className="text-sm font-mono text-slate-50">
                    <code>{generatedSql}</code>
                  </pre>
                </div>
                
                <div className="p-3 border-t border-white/10 bg-[#161b22] flex justify-end gap-3">
                  {hasCreateTable && (
                    <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={handleAddToDatabase}>
                      <Plus className="w-4 h-4 mr-2" /> Add to Schema
                    </Button>
                  )}
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleExecute} disabled={isExecuting}>
                    {isExecuting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                    Run Query
                  </Button>
                </div>
              </div>

              {explanation && (
                <Card className="border-border/50 bg-card/60 backdrop-blur-md">
                  <CardContent className="p-5 flex gap-4 items-start">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {explanation}
                    </p>
                  </CardContent>
                </Card>
              )}

              {schemaTables && schemaTables.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold tracking-tight mt-8">Schema Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {schemaTables.map((t, idx) => (
                      <Card key={idx} className="border-border/50 bg-card/60 backdrop-blur-md hover:border-primary/50 transition-colors">
                        <CardContent className="p-4 space-y-3">
                          <h4 className="font-bold text-primary flex items-center">
                            <Database className="w-4 h-4 mr-2" />
                            {t.tableName}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                          <div className="space-y-2 pt-3 border-t border-border/50">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Columns</span>
                            <div className="flex flex-wrap gap-1.5">
                              {t.columns?.map((c: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-[10px] font-mono bg-background/50">{c}</Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {erd && (
                <div className="rounded-xl overflow-hidden border border-border shadow-lg bg-[#0d1117] flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#161b22]">
                    <div className="flex items-center text-sm font-medium text-slate-300">
                      <Network className="w-4 h-4 mr-2" />
                      Entity Relationships
                    </div>
                  </div>
                  <div className="p-5 overflow-x-auto">
                    <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {erd}
                    </pre>
                  </div>
                </div>
              )}

              {sampleData && (
                <div className="rounded-xl overflow-hidden border border-border shadow-lg bg-[#0d1117] flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#161b22]">
                    <div className="flex items-center text-sm font-medium text-slate-300">
                      <Code2 className="w-4 h-4 mr-2" />
                      Sample Data (INSERT)
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => {
                      navigator.clipboard.writeText(sampleData);
                      toast.success("Copied sample data");
                    }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-4 overflow-x-auto">
                    <pre className="text-sm font-mono text-slate-50">
                      <code>{sampleData}</code>
                    </pre>
                  </div>
                  <div className="p-3 border-t border-white/10 bg-[#161b22] flex justify-end gap-3">
                    <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground" onClick={handleExecuteSampleData} disabled={isExecuting}>
                      {isExecuting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                      Insert Sample Data
                    </Button>
                  </div>
                </div>
              )}

              {/* Execution Results Grid */}
              {executionResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-md">
                    <CardContent className="p-0">
                      {executionResult.error ? (
                        <div className="p-4 text-sm text-destructive bg-destructive/10">
                          <strong>Error:</strong> {executionResult.error}
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="px-4 py-3 border-b border-border/50 bg-muted/30 flex justify-between items-center text-sm text-muted-foreground">
                            <span>{executionResult.affectedRows} rows affected in {executionResult.executionTimeMs}ms</span>
                          </div>
                          {executionResult.data && executionResult.data.length > 0 ? (
                            <div className="overflow-x-auto max-h-[300px]">
                              <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/50 sticky top-0">
                                  <tr>
                                    {Object.keys(executionResult.data[0]).map(key => (
                                      <th key={key} className="px-4 py-3 font-medium border-b border-border/50">{key}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {executionResult.data.map((row: any, i: number) => (
                                    <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                                      {Object.values(row).map((val: any, j: number) => (
                                        <td key={j} className="px-4 py-2 truncate max-w-[200px]">
                                          {val !== null ? String(val) : <span className="text-muted-foreground italic">null</span>}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-4 text-sm text-muted-foreground text-center">Query executed successfully. No rows returned.</div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <div className="h-full min-h-[400px] rounded-xl border border-dashed border-border/60 flex flex-col items-center justify-center text-center p-8 bg-card/30">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No query generated yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Describe what you want to do on the left, and your generated SQL will appear here, fully formatted and ready to use.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
