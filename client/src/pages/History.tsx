import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Trash2, Clock, X, Code2, Copy } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

import { toast } from 'sonner';
import axios from 'axios';

interface HistoryItem {
  id: string;
  title: string;
  prompt: string;
  sql: string;
  dialect: string;
  type: string;
  explanation: string;
  isFavorite: boolean;
  createdAt: string;
}

export default function History() {
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get('/api/sql/history');
      if (data.history) setHistory(data.history);
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // In a full implementation, you'd call an API to toggle favorite status here
    setHistory(history.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const deleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/sql/history/${id}`);
      setHistory(history.filter(item => item.id !== id));
      toast.success("Query deleted");
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (error) {
      toast.error('Failed to delete query');
    }
  };

  const filteredHistory = history.filter(item => 
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.prompt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Query History</h1>
          <p className="text-muted-foreground">Find and reuse your previously generated SQL queries.</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search history..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-medium">Title & Prompt</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Dialect</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Loading history...
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No queries found matching your search.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr 
                    key={item.id} 
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer group"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground mb-1">{item.title || 'Untitled Query'}</div>
                      <div className="text-muted-foreground truncate max-w-[300px]">{item.prompt}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {item.type || 'SELECT'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {item.dialect || 'PostgreSQL'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1.5" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => toggleFavorite(e, item.id)}
                          className={`p-2 rounded-md hover:bg-muted transition-colors ${item.isFavorite ? 'text-yellow-500' : 'text-muted-foreground'}`}
                        >
                          <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                        <button 
                          onClick={(e) => deleteItem(e, item.id)}
                          className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-card border-l border-border/50 shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div>
                <h3 className="font-semibold text-lg">{selectedItem.title || 'Untitled Query'}</h3>
                <p className="text-sm text-muted-foreground">{new Date(selectedItem.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  Original Prompt
                </h4>
                <div className="p-4 rounded-lg bg-muted/30 text-sm border border-border/50">
                  {selectedItem.prompt}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-muted-foreground" />
                    Generated SQL
                  </span>
                  <Button variant="ghost" size="sm" className="h-8" onClick={() => {
                    navigator.clipboard.writeText(selectedItem.sql);
                    toast.success("Copied to clipboard");
                  }}>
                    <Copy className="w-3.5 h-3.5 mr-2" />
                    Copy
                  </Button>
                </h4>
                <div className="relative">
                  <pre className="p-4 rounded-lg bg-[#1a1b26] text-[#a9b1d6] text-sm overflow-x-auto border border-border/50 font-mono">
                    {selectedItem.sql}
                  </pre>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Explanation</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedItem.explanation}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-border/50 bg-muted/10 flex gap-3">
              <Button className="flex-1">Open in Editor</Button>
              <Button variant="outline" onClick={(e) => deleteItem(e, selectedItem.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for details panel */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
