import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Table, LayoutTemplate, Plus, Edit2, Trash2, Download, X, Key, AlignLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import axios from 'axios';

export default function Database() {
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);

  const fetchTables = async () => {
    try {
      const { data } = await axios.get('/api/schema/tables');
      if (data.tables) {
        setTables(data.tables);
      }
    } catch (error) {
      toast.error('Failed to load tables');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/schema/tables/${id}`);
      toast.success('Table deleted successfully');
      setTables(tables.filter(t => t.id !== id));
    } catch (error) {
      toast.error('Failed to delete table');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Database Schema</h1>
          <p className="text-muted-foreground">Manage and visualize your active database tables.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 rounded-xl border border-border/50 bg-card/60 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="flex justify-between pt-4">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))
        ) : tables.length > 0 ? (
          tables.map((table, i) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group p-6 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:border-primary/50 transition-all hover:shadow-md flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Table className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">{table.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Created {new Date(table.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="space-y-3 flex-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Columns</span>
                  <span className="font-medium">{table.columns?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Primary Key</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {table.columns?.find((c: any) => c.isPrimary || c.isPrimaryKey)?.name || 'id'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Dialect</span>
                  <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary">PostgreSQL</Badge>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setSelectedTable(table)}>
                  <LayoutTemplate className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                
                <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(table.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full h-[400px] flex flex-col items-center justify-center text-center p-8 bg-card/30 rounded-xl border border-dashed border-border/60">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Table className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No tables tracked yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Go to the Generate page, create a new SQL table, and click "Add to Schema" to start tracking it here.
            </p>
          </div>
        )}
      </div>

      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Table className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedTable.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedTable.columns?.length || 0} columns • Added {new Date(selectedTable.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedTable(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Column Name</th>
                      <th className="px-4 py-3 font-medium">Data Type</th>
                      <th className="px-4 py-3 font-medium">Attributes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {selectedTable.columns?.map((col: any) => (
                      <tr key={col.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                          {col.name}
                          {(col.isPrimary || col.isPrimaryKey) && (
                            <Key className="w-3 h-3 text-amber-500" title="Primary Key" />
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-primary/80">{col.type}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {(col.isPrimary || col.isPrimaryKey) && <Badge variant="secondary" className="text-[10px] h-5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">PK</Badge>}
                            {col.isNotNull && <Badge variant="outline" className="text-[10px] h-5">NOT NULL</Badge>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!selectedTable.columns || selectedTable.columns.length === 0) && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                          No columns found for this table.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
