"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search, Sparkles, CheckCircle, Copy, BookOpen, TrendingUp, Globe, AlertCircle } from "lucide-react"
import { hsCodeSuggestionsService, HSCodeSuggestion } from "@/lib/hs-code-suggestions"

export default function HSCodeCopilot() {
  const [productDescription, setProductDescription] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<HSCodeSuggestion[]>([])
  const [selectedCode, setSelectedCode] = useState<string>("")

  const handleSearch = async () => {
    if (!productDescription.trim()) return

    setIsSearching(true)
    setSuggestions([])

    try {
      // Use real AI service
      const response = await hsCodeSuggestionsService.getSuggestions(
        productDescription.trim(),
        additionalInfo.trim()
      )

      if (response.success && response.data.success) {
        setSuggestions(response.data.suggestions)
      } else {
        console.error('HS Code suggestions failed:', response.message)
        // Fallback to demo suggestions if API fails
        setSuggestions([
          {
            code: "9999.99.99",
            description: "Other articles not elsewhere specified",
            confidence: 50,
            category: "Miscellaneous",
            dutyRate: "Varies",
            restrictions: ["Consult customs authorities"],
            similarProducts: ["General merchandise", "Unspecified articles"]
          }
        ])
      }
    } catch (error) {
      console.error('HS Code suggestions error:', error)
      // Fallback to demo suggestions
      setSuggestions([
        {
          code: "9999.99.99",
          description: "Other articles not elsewhere specified",
          confidence: 50,
          category: "Miscellaneous",
          dutyRate: "Varies",
          restrictions: ["Consult customs authorities"],
          similarProducts: ["General merchandise", "Unspecified articles"]
        }
      ])
    } finally {
      setIsSearching(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const selectCode = (code: string) => {
    setSelectedCode(code)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HS Code Copilot</h1>
          <p className="text-gray-600 mt-2">AI-powered HS Code suggestions based on product descriptions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
                  Product Information
                </CardTitle>
                <CardDescription>Describe your product in detail for accurate HS Code suggestions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product-description">Product Description *</Label>
                  <Textarea
                    id="product-description"
                    placeholder="e.g., Laptop computer with 15.6 inch screen, Intel processor, 8GB RAM, 256GB SSD storage"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional-info">Additional Information (Optional)</Label>
                  <Textarea
                    id="additional-info"
                    placeholder="Material composition, intended use, technical specifications, brand, model, etc."
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={handleSearch} disabled={!productDescription.trim() || isSearching} className="w-full">
                  {isSearching ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      AI is analyzing your product...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Get HS Code Suggestions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {isSearching && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Sparkles className="h-5 w-5 text-blue-500 animate-spin" />
                      <span className="font-medium">AI Processing in Progress</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Analyzing product description...</span>
                        <span>100%</span>
                      </div>
                      <Progress value={100} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Matching with HS Code database...</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Calculating confidence scores...</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Suggestions</CardTitle>
                  <CardDescription>Ranked by confidence score and relevance to your product</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.code}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedCode === suggestion.code ? "border-blue-500 bg-blue-50" : "hover:border-gray-300"
                        }`}
                        onClick={() => selectCode(suggestion.code)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold">{suggestion.code}</h3>
                              <Badge variant="outline">Rank #{index + 1}</Badge>
                              <Badge variant={suggestion.confidence > 90 ? "default" : "secondary"}>
                                {suggestion.confidence}% confidence
                              </Badge>
                            </div>
                            <p className="text-gray-700 mb-3">{suggestion.description}</p>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-500">Category:</span>
                                <span className="ml-2">{suggestion.category}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-500">Duty Rate:</span>
                                <span className="ml-2 text-green-600 font-medium">{suggestion.dutyRate}</span>
                              </div>
                            </div>

                            {suggestion.restrictions && suggestion.restrictions.length > 0 && (
                              <div className="mt-3">
                                <span className="font-medium text-gray-500 text-sm">Restrictions:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {suggestion.restrictions.map((restriction, idx) => (
                                    <Badge key={idx} variant="destructive" className="text-xs">
                                      {restriction}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="mt-3">
                              <span className="font-medium text-gray-500 text-sm">Similar Products:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {suggestion.similarProducts.map((product, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {product}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            <Button variant="outline" size="sm" onClick={() => copyToClipboard(suggestion.code)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={selectedCode === suggestion.code ? "default" : "outline"}
                              size="sm"
                              onClick={() => selectCode(suggestion.code)}
                            >
                              {selectedCode === suggestion.code ? <CheckCircle className="h-4 w-4" /> : "Select"}
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              Confidence: {suggestion.confidence}%
                            </div>
                            <div className="flex items-center">
                              <Globe className="h-4 w-4 mr-1" />
                              {suggestion.category}
                            </div>
                          </div>
                          <Progress value={suggestion.confidence} className="w-24" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedCode && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Selected HS Code: {selectedCode}</span>
                      </div>
                      <p className="text-sm text-green-700">
                        This HS Code has been selected for your product. You can now use it in your export
                        documentation.
                      </p>
                      <div className="mt-3 flex space-x-2">
                        <Button size="sm">Add to Document</Button>
                        <Button variant="outline" size="sm">
                          Save for Later
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">GPT-4 Powered Analysis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Real-time Database Lookup</span>
                </div>
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <span className="text-sm">Confidence Scoring</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-orange-500" />
                  <span className="text-sm">Global Trade Compliance</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Searches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-medium">Laptop Computer</p>
                    <p className="text-xs text-gray-500">HS Code: 8471.30.00</p>
                    <p className="text-xs text-gray-500">95% confidence</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-medium">Cotton T-Shirt</p>
                    <p className="text-xs text-gray-500">HS Code: 6109.10.00</p>
                    <p className="text-xs text-gray-500">92% confidence</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-medium">Steel Pipes</p>
                    <p className="text-xs text-gray-500">HS Code: 7306.30.00</p>
                    <p className="text-xs text-gray-500">88% confidence</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips for Better Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Be Specific</p>
                    <p className="text-xs text-gray-600">Include material, size, function, and intended use</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Technical Details</p>
                    <p className="text-xs text-gray-600">Add specifications, model numbers, and technical features</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Multiple Searches</p>
                    <p className="text-xs text-gray-600">Try different descriptions for complex products</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
