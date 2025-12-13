import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AuditLogs = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-xl font-bold">Audit Logs</CardTitle>
              <CardDescription>
                View and monitor system activity logs
              </CardDescription>
            </div>
            <div>
              <Button variant="outline">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export Logs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-12 text-center text-muted-foreground">
            <h3 className="text-lg font-medium mb-2">Audit Logs Content</h3>
            <p>This section will display system audit logs and user activity monitoring</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;