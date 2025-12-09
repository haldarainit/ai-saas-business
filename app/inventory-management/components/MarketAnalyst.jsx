'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Search, Brain, Star, Package, Users, DollarSign } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function MarketAnalyst() {
  const [category, setCategory] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyzeMarket = async () => {
    if (!category.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a product category',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/market-analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: category.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze market');
      }

      setAnalysis(data);
      toast({
        title: 'Analysis Complete',
        description: `Found ${data.viralProducts.length} trending products in ${category}`,
      });
    } catch (error) {
      console.error('Market analysis error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to analyze market trends',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDemandColor = (level) => {
    switch (level) {
      case 'Explosive': return 'bg-red-500 text-white';
      case 'Very High': return 'bg-orange-500 text-white';
      case 'High': return 'bg-amber-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
              <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            AI Market Analyst
            <Badge variant="secondary" className="ml-2">Beta</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Discover trending products with AI-powered market analysis. Get insights on viral products, demand levels, and competitor data.
          </p>
          
          {/* Search Input */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
                </div>
              )}
              <Input
                placeholder="Enter product category (e.g., electronics, fashion, beauty)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="pl-10 pr-10"
                onKeyPress={(e) => e.key === 'Enter' && analyzeMarket()}
              />
            </div>
            <Button 
              onClick={analyzeMarket} 
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analyze Market
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Market Analysis for {analysis.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{analysis.summary}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span>Generated: {new Date(analysis.generatedAt).toLocaleString()}</span>
                <span>•</span>
                <span>{analysis.viralProducts.length} trending products found</span>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analysis.viralProducts.map((product, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{product.productName}</CardTitle>
                    <Badge className={getDemandColor(product.estimatedDemandLevel)}>
                      {product.estimatedDemandLevel}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{product.brand}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Popularity Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Popularity Score</span>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className={`font-bold ${getScoreColor(product.popularityScore)}`}>
                        {product.popularityScore}/100
                      </span>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{product.priceRange}</span>
                  </div>

                  {/* Trend Reason */}
                  <div>
                    <h4 className="text-sm font-medium mb-1">Trend Reason</h4>
                    <p className="text-sm text-muted-foreground">{product.trendReason}</p>
                  </div>

                  {/* Top Competitors */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Top Competitors</h4>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(product.topCompetitors) 
                        ? product.topCompetitors.map((competitor, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {competitor}
                            </Badge>
                          ))
                        : product.topCompetitors.split(',').map((competitor, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {competitor.trim()}
                            </Badge>
                          ))
                      }
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Package className="mr-2 h-3 w-3" />
                      Add to Inventory
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1">
                      <Users className="mr-2 h-3 w-3" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !loading && (
        <Card className="text-center py-12">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Ready to analyze market trends?</h3>
          <p className="text-muted-foreground mb-4">
            Enter a product category to discover trending products and market insights
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['electronics', 'fashion', 'beauty', 'home & kitchen', 'sports'].map((cat) => (
              <Button
                key={cat}
                variant="outline"
                size="sm"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
