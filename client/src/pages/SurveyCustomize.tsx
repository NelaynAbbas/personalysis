import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { surveyTypes } from "@/lib/surveyQuestions";

const SurveyCustomize = () => {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("general");
  const [surveyType, setSurveyType] = useState("personality");
  const [isCustomLogo, setIsCustomLogo] = useState(false);
  const [isIntroEnabled, setIsIntroEnabled] = useState(true);
  const [isCustomTheme, setIsCustomTheme] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveChanges = () => {
    setIsSaving(true);
    // In a real app, we would save the changes to the server
    setTimeout(() => {
      setIsSaving(false);
      setLocation('/dashboard');
    }, 1000);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customize Survey</h1>
          <p className="text-gray-600 mt-1">
            Configure your survey settings and appearance to match your brand.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setLocation('/dashboard')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            className="bg-primary hover:bg-primary-dark text-white"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("general")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "general"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="material-icons mr-3 text-sm">settings</span>
                General Settings
              </button>
              <button
                onClick={() => setActiveTab("appearance")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "appearance"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="material-icons mr-3 text-sm">palette</span>
                Appearance
              </button>
              <button
                onClick={() => setActiveTab("questions")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "questions"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="material-icons mr-3 text-sm">quiz</span>
                Questions
              </button>
              <button
                onClick={() => setActiveTab("results")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "results"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="material-icons mr-3 text-sm">assessment</span>
                Results Page
              </button>
              <button
                onClick={() => setActiveTab("share")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "share"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="material-icons mr-3 text-sm">share</span>
                Sharing Options
              </button>
              <button
                onClick={() => setActiveTab("integrations")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "integrations"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="material-icons mr-3 text-sm">integration_instructions</span>
                Integrations
              </button>
            </nav>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {activeTab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure basic survey settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="survey-name">Survey Name</Label>
                  <Input id="survey-name" defaultValue="Personality Assessment" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="survey-description">Survey Description</Label>
                  <Textarea
                    id="survey-description"
                    defaultValue="Discover your unique personality traits and insights with our comprehensive assessment."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="survey-type">Survey Type</Label>
                  <Select defaultValue={surveyType} onValueChange={setSurveyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a survey type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(surveyTypes).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="intro-enabled">Enable Introduction</Label>
                    <p className="text-sm text-gray-500">Show an introduction screen before the survey</p>
                  </div>
                  <Switch
                    id="intro-enabled"
                    checked={isIntroEnabled}
                    onCheckedChange={setIsIntroEnabled}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize how your survey looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="custom-logo">Custom Logo</Label>
                    <p className="text-sm text-gray-500">Use your own logo instead of default</p>
                  </div>
                  <Switch
                    id="custom-logo"
                    checked={isCustomLogo}
                    onCheckedChange={setIsCustomLogo}
                  />
                </div>
                {isCustomLogo && (
                  <div className="space-y-2">
                    <Label htmlFor="logo-upload">Upload Logo</Label>
                    <Input id="logo-upload" type="file" />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="custom-theme">Custom Theme Colors</Label>
                    <p className="text-sm text-gray-500">Use custom colors for your survey</p>
                  </div>
                  <Switch
                    id="custom-theme"
                    checked={isCustomTheme}
                    onCheckedChange={setIsCustomTheme}
                  />
                </div>
                {isCustomTheme && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className="flex">
                        <Input id="primary-color" defaultValue="#3B82F6" />
                        <div className="w-10 h-10 ml-2 rounded-md bg-blue-500"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondary-color">Secondary Color</Label>
                      <div className="flex">
                        <Input id="secondary-color" defaultValue="#10B981" />
                        <div className="w-10 h-10 ml-2 rounded-md bg-green-500"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="font-family">Font Family</Label>
                  <Select defaultValue="inter">
                    <SelectTrigger>
                      <SelectValue placeholder="Select font family" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Modern Sans-Serif */}
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Modern Sans-Serif</div>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="poppins">Poppins</SelectItem>
                      <SelectItem value="openSans">Open Sans</SelectItem>
                      <SelectItem value="lato">Lato</SelectItem>
                      <SelectItem value="montserrat">Montserrat</SelectItem>
                      <SelectItem value="nunito">Nunito</SelectItem>
                      <SelectItem value="quicksand">Quicksand</SelectItem>

                      {/* Professional & Elegant */}
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Professional & Elegant</div>
                      <SelectItem value="playfair">Playfair Display</SelectItem>
                      <SelectItem value="cormorant">Cormorant</SelectItem>
                      <SelectItem value="lora">Lora</SelectItem>
                      <SelectItem value="merriweather">Merriweather</SelectItem>

                      {/* Geometric & Clean */}
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Geometric & Clean</div>
                      <SelectItem value="raleway">Raleway</SelectItem>
                      <SelectItem value="geometric">Geometric Sans</SelectItem>
                      <SelectItem value="proxima">Proxima Nova</SelectItem>

                      {/* Friendly & Rounded */}
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Friendly & Rounded</div>
                      <SelectItem value="rubik">Rubik</SelectItem>
                      <SelectItem value="comfortaa">Comfortaa</SelectItem>
                      <SelectItem value="varela">Varela Round</SelectItem>

                      {/* Tech & Modern */}
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Tech & Modern</div>
                      <SelectItem value="sora">Sora</SelectItem>
                      <SelectItem value="space">Space Mono</SelectItem>
                      <SelectItem value="source">Source Sans Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "questions" && (
            <Card>
              <CardHeader>
                <CardTitle>Questions Settings</CardTitle>
                <CardDescription>Customize the questions in your survey</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="questions-list">
                  <TabsList className="mb-4">
                    <TabsTrigger value="questions-list">Questions List</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
                  </TabsList>
                  <TabsContent value="questions-list">
                    <div className="border rounded-md p-4 mb-4">
                      <p className="text-amber-600 mb-4">
                        <span className="material-icons text-sm align-middle mr-1">info</span>
                        In the Pro version, you can customize all questions and add your own. The free version includes our scientifically validated question sets.
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <p className="font-medium">Decision-making style</p>
                            <p className="text-sm text-gray-600">How do you make important decisions?</p>
                          </div>
                          <Button variant="outline" size="sm" disabled>Edit</Button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <p className="font-medium">Risk tolerance</p>
                            <p className="text-sm text-gray-600">How do you approach risky situations?</p>
                          </div>
                          <Button variant="outline" size="sm" disabled>Edit</Button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <p className="font-medium">Social preferences</p>
                            <p className="text-sm text-gray-600">How do you interact in social settings?</p>
                          </div>
                          <Button variant="outline" size="sm" disabled>Edit</Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="advanced">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Randomize Question Order</Label>
                          <p className="text-sm text-gray-500">Present questions in random order to reduce bias</p>
                        </div>
                        <Switch defaultChecked={false} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Required Questions</Label>
                          <p className="text-sm text-gray-500">Make all questions required to complete</p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-questions">Maximum Questions</Label>
                        <div className="flex items-center">
                          <Input id="max-questions" type="number" defaultValue="10" className="w-20" />
                          <p className="ml-3 text-sm text-gray-500">questions per survey</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {activeTab === "results" && (
            <Card>
              <CardHeader>
                <CardTitle>Results Page Settings</CardTitle>
                <CardDescription>Customize the results page experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Detailed Insights</Label>
                    <p className="text-sm text-gray-500">Display detailed analysis of personality traits</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable AI-Generated Insights</Label>
                    <p className="text-sm text-gray-500">Use AI to generate personalized insights</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Radar Chart</Label>
                    <p className="text-sm text-gray-500">Display radar chart visualization of traits</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Downloading Results</Label>
                    <p className="text-sm text-gray-500">Let users download their results as PDF</p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "share" && (
            <Card>
              <CardHeader>
                <CardTitle>Sharing Options</CardTitle>
                <CardDescription>Configure how your survey can be shared</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Survey URL</Label>
                  <div className="flex">
                    <Input readOnly value="https://personaprofiler.app/s/personality-assessment" className="flex-1" />
                    <Button className="ml-2">
                      <span className="material-icons">content_copy</span>
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Social Sharing</Label>
                    <p className="text-sm text-gray-500">Allow users to share results on social media</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Results</Label>
                    <p className="text-sm text-gray-500">Allow users to email their results</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Embed Survey</Label>
                    <p className="text-sm text-gray-500">Allow embedding the survey on other websites</p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "integrations" && (
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>Connect your survey with other services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-md p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center mr-4">
                      <span className="material-icons text-blue-600">business</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">CRM Integration</h3>
                      <p className="text-sm text-gray-600">Connect to your CRM system for seamless data flow</p>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                </div>
                <div className="border rounded-md p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-md bg-green-100 flex items-center justify-center mr-4">
                      <span className="material-icons text-green-600">email</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Email Marketing</h3>
                      <p className="text-sm text-gray-600">Connect to your email marketing platform</p>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                </div>
                <div className="border rounded-md p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-md bg-purple-100 flex items-center justify-center mr-4">
                      <span className="material-icons text-purple-600">analytics</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Analytics</h3>
                      <p className="text-sm text-gray-600">Connect to your analytics platform</p>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                </div>
                <div className="border rounded-md p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-md bg-orange-100 flex items-center justify-center mr-4">
                      <span className="material-icons text-orange-600">webhook</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Webhooks</h3>
                      <p className="text-sm text-gray-600">Set up webhooks for real-time data updates</p>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
};

export default SurveyCustomize;